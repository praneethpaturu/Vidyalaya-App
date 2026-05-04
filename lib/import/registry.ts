// Migration Center registry. Every importable entity declares:
//  - its label + description (UI)
//  - dependsOn[]: enforced import order (UI greys out blocked entities)
//  - fields[]: target keys we accept, with header-name hints for the
//    heuristic auto-mapper
//  - create(): receives the mapped rows, writes them to the DB, and
//    returns per-row error info
//
// Adding a new entity = ~30 lines + a single Prisma create function.

import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export type ImportEntity =
  | "classes" | "subjects" | "staff" | "students" | "guardians"
  | "fee_structures" | "salary_structures" | "buses" | "routes"
  | "inventory_items" | "books" | "vendors" | "org_tax_profile"
  | "invoices" | "payments" | "payslips" | "class_attendance"
  | "staff_attendance" | "exam_marks" | "book_issues" | "vendor_tds"
  | "question_bank";

export type Tier = 1 | 2 | 3;

export type FieldDef = {
  key: string;
  label: string;
  required: boolean;
  example: string;
  hints: RegExp[];
};

export type ImportRunResult = {
  created: number;
  skipped: number;
  errors: Array<{ row: number; reason: string }>;
};

export type EntityDef = {
  key: ImportEntity;
  tier: Tier;
  label: string;
  description: string;
  dependsOn: ImportEntity[];
  status: "ready" | "coming-soon";
  fields: FieldDef[];
  create?: (rows: Record<string, string>[], opts: { schoolId: string; userId: string }) => Promise<ImportRunResult>;
};

// ── Tier 1 ──────────────────────────────────────────────────────────────────
const CLASSES: EntityDef = {
  key: "classes", tier: 1, status: "ready",
  label: "Classes / Grades / Sections",
  description: "Each row is one class section (e.g. Grade 8 - A). Required first — students, subjects, timetable all reference classes.",
  dependsOn: [],
  fields: [
    { key: "name",    label: "Class name",    required: true,  example: "Grade 8 - A", hints: [/^name$|class[\s_-]?name/i] },
    { key: "grade",   label: "Grade / std",   required: true,  example: "8",           hints: [/grade|standard|^std$/i] },
    { key: "section", label: "Section",       required: true,  example: "A",           hints: [/section|division|div/i] },
    { key: "theme",   label: "Theme colour",  required: false, example: "sky",         hints: [/theme|colour|color/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const grade = String(r.grade || "").trim();
        if (!grade) throw new Error("grade is required");
        if (!r.section) throw new Error("section is required");
        const existing = await prisma.class.findFirst({
          where: { schoolId, grade, section: r.section },
        });
        if (existing) { out.skipped++; continue; }
        await prisma.class.create({
          data: {
            schoolId,
            name: r.name || `Grade ${grade} - ${r.section}`,
            grade, section: r.section,
            theme: (r.theme as any) || "sky",
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const SUBJECTS: EntityDef = {
  key: "subjects", tier: 1, status: "ready",
  label: "Subjects per class",
  description: "Each row is one subject (e.g. Mathematics) attached to one class. Optional teacher (matched by employeeId).",
  dependsOn: ["classes", "staff"],
  fields: [
    { key: "code",        label: "Subject code", required: true,  example: "MATH",       hints: [/code|subj[\s_-]?code/i] },
    { key: "name",        label: "Subject name", required: true,  example: "Mathematics",hints: [/^name$|subj(ect)?[\s_-]?name/i] },
    { key: "className",   label: "Class name",   required: true,  example: "Grade 8 - A",hints: [/class|grade/i] },
    { key: "teacherEmpId",label: "Teacher emp ID",required: false,example: "EMP-021",    hints: [/teacher|emp(loyee)?[\s_-]?id/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    const classes = new Map((await prisma.class.findMany({ where: { schoolId } })).map((c) => [c.name, c.id]));
    const staff = new Map((await prisma.staff.findMany({ where: { schoolId }, select: { id: true, employeeId: true } })).map((s) => [s.employeeId, s.id]));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const classId = classes.get(r.className);
        if (!classId) throw new Error(`unknown class "${r.className}"`);
        if (!r.code || !r.name) throw new Error("code and name are required");
        const teacherId = r.teacherEmpId ? staff.get(r.teacherEmpId) ?? null : null;
        const existing = await prisma.subject.findFirst({ where: { classId, code: r.code } });
        if (existing) { out.skipped++; continue; }
        await prisma.subject.create({ data: { schoolId, classId, code: r.code, name: r.name, teacherId } });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const STAFF: EntityDef = {
  key: "staff", tier: 1, status: "ready",
  label: "Staff (teachers + admin)",
  description: "Each row is a staff member. We create a User row (login) + Staff row (employment). Default password is the employeeId; staff change it on first login via /forgot-password.",
  dependsOn: [],
  fields: [
    { key: "employeeId",  label: "Employee ID",  required: true,  example: "EMP-021",     hints: [/^emp(loyee)?[\s_-]?id|^staff[\s_-]?id/i] },
    { key: "name",        label: "Full name",    required: true,  example: "Ananya Iyer", hints: [/^name$|full[\s_-]?name|staff[\s_-]?name/i] },
    { key: "email",       label: "Email",        required: true,  example: "ananya@school.edu.in", hints: [/email/i] },
    { key: "designation", label: "Designation",  required: true,  example: "Math Teacher",hints: [/designation|title|role/i] },
    { key: "department",  label: "Department",   required: false, example: "Academics",   hints: [/department|dept/i] },
    { key: "phone",       label: "Phone",        required: false, example: "+91 98xxx",   hints: [/phone|mobile|contact/i] },
    { key: "joiningDate", label: "Joining date", required: false, example: "2020-06-01",  hints: [/join(ing)?[\s_-]?date|hire[\s_-]?date|doj/i] },
    { key: "qualification",label:"Qualification",required: false, example: "M.Sc.",       hints: [/qualification|degree/i] },
    { key: "pan",         label: "PAN",          required: false, example: "ABCDE1234F",  hints: [/^pan$/i] },
    { key: "bankAccount", label: "Bank account", required: false, example: "1234567890",  hints: [/bank[\s_-]?(a\/?c|account)/i] },
    { key: "ifsc",        label: "IFSC",         required: false, example: "HDFC0001234", hints: [/ifsc/i] },
    { key: "role",        label: "App role",     required: false, example: "TEACHER",     hints: [/^role$|app[\s_-]?role/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.employeeId || !r.name || !r.email) throw new Error("employeeId, name, email required");
        const email = r.email.toLowerCase().trim();
        if (await prisma.user.findUnique({ where: { email } })) { out.skipped++; continue; }
        if (await prisma.staff.findFirst({ where: { schoolId, employeeId: r.employeeId } })) { out.skipped++; continue; }
        const role = (r.role || "TEACHER").toUpperCase();
        const password = await bcrypt.hash(r.employeeId, 10);
        await prisma.$transaction(async (tx) => {
          const u = await tx.user.create({
            data: {
              schoolId, email, password, name: r.name,
              phone: r.phone || null, role, active: true,
            },
          });
          await tx.staff.create({
            data: {
              schoolId, userId: u.id,
              employeeId: r.employeeId,
              designation: r.designation,
              department: r.department || null,
              joiningDate: r.joiningDate ? new Date(r.joiningDate) : new Date(),
              qualification: r.qualification || null,
              pan: r.pan || null,
              bankAccount: r.bankAccount || null,
              ifsc: r.ifsc || null,
            },
          });
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const STUDENTS: EntityDef = {
  key: "students", tier: 1, status: "ready",
  label: "Students",
  description: "Each row creates a User (login) + Student row + (optional) Guardian rows linked via GuardianStudent. Class is matched by name.",
  dependsOn: ["classes"],
  fields: [
    { key: "admissionNo", label: "Admission No",  required: true,  example: "ADM-2024-001", hints: [/admission|adm[\s_-]?no|enroll(ment)?[\s_-]?no/i] },
    { key: "name",        label: "Full name",     required: true,  example: "Aarav Sharma", hints: [/^name$|full[\s_-]?name|student[\s_-]?name/i] },
    { key: "email",       label: "Student email", required: false, example: "aarav@dpsbangalore.edu.in", hints: [/^email$|student[\s_-]?email/i] },
    { key: "rollNo",      label: "Roll No",       required: false, example: "01",            hints: [/roll/i] },
    { key: "className",   label: "Class",         required: false, example: "Grade 8 - A",  hints: [/class|grade|standard/i] },
    { key: "section",     label: "Section",       required: false, example: "A",             hints: [/section|division/i] },
    { key: "dob",         label: "Date of birth", required: false, example: "2012-05-04",   hints: [/dob|date[\s_-]?of[\s_-]?birth|birth/i] },
    { key: "gender",      label: "Gender",        required: false, example: "M",             hints: [/gender|sex/i] },
    { key: "bloodGroup",  label: "Blood group",   required: false, example: "O+",            hints: [/blood/i] },
    { key: "address",     label: "Address",       required: false, example: "123 MG Road",  hints: [/address/i] },
    { key: "fatherName",  label: "Father name",   required: false, example: "Rajesh Sharma", hints: [/father[\s_-]?(name)?$|guardian[\s_-]?(name)?$/i] },
    { key: "fatherEmail", label: "Father email",  required: false, example: "rajesh@gmail.com", hints: [/father[\s_-]?email|guardian[\s_-]?email/i] },
    { key: "fatherPhone", label: "Father phone",  required: false, example: "+91 98xxx",     hints: [/father[\s_-]?(phone|mobile)/i] },
    { key: "motherName",  label: "Mother name",   required: false, example: "Sunita Sharma", hints: [/mother[\s_-]?(name)?/i] },
    { key: "motherEmail", label: "Mother email",  required: false, example: "",              hints: [/mother[\s_-]?email/i] },
    { key: "motherPhone", label: "Mother phone",  required: false, example: "",              hints: [/mother[\s_-]?(phone|mobile)/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    const classes = new Map((await prisma.class.findMany({ where: { schoolId } })).map((c) => [c.name.toLowerCase(), c.id]));
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.admissionNo || !r.name) throw new Error("admissionNo and name are required");
        if (await prisma.student.findFirst({ where: { schoolId, admissionNo: r.admissionNo } })) { out.skipped++; continue; }
        const email = (r.email || `${r.admissionNo.toLowerCase()}@students.local`).toLowerCase().trim();
        if (await prisma.user.findUnique({ where: { email } })) { out.skipped++; continue; }
        const classId = r.className ? classes.get(r.className.toLowerCase()) ?? null : null;
        const password = await bcrypt.hash(r.admissionNo, 10);
        const dob = r.dob ? new Date(r.dob) : new Date(2010, 0, 1);
        await prisma.$transaction(async (tx) => {
          const u = await tx.user.create({
            data: { schoolId, email, password, name: r.name, role: "STUDENT", active: true },
          });
          const stu = await tx.student.create({
            data: {
              schoolId, userId: u.id,
              admissionNo: r.admissionNo,
              rollNo: r.rollNo || "0",
              classId, section: r.section || null,
              dob, gender: r.gender || "Other",
              bloodGroup: r.bloodGroup || null,
              address: r.address || "—",
            },
          });
          // Optional guardians — father / mother (if either name + email provided)
          for (const g of [
            { name: r.fatherName, email: r.fatherEmail, phone: r.fatherPhone, relation: "Father" },
            { name: r.motherName, email: r.motherEmail, phone: r.motherPhone, relation: "Mother" },
          ]) {
            if (!g.name) continue;
            const gemail = (g.email || `${stu.id}-${g.relation.toLowerCase()}@guardians.local`).toLowerCase().trim();
            // Reuse existing guardian-user if same email already set up
            let gu = await tx.user.findUnique({ where: { email: gemail } });
            if (!gu) {
              gu = await tx.user.create({
                data: {
                  schoolId, email: gemail,
                  password: await bcrypt.hash(stu.admissionNo, 10),
                  name: g.name, phone: g.phone || null,
                  role: "PARENT", active: true,
                },
              });
            }
            let guardian = await tx.guardian.findUnique({ where: { userId: gu.id } });
            if (!guardian) {
              guardian = await tx.guardian.create({ data: { schoolId, userId: gu.id, relation: g.relation } });
            }
            await tx.guardianStudent.create({ data: { guardianId: guardian.id, studentId: stu.id, isPrimary: g.relation === "Father" } }).catch(() => {});
          }
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const GUARDIANS: EntityDef = {
  key: "guardians", tier: 1, status: "ready",
  label: "Guardians (extra parents / linked students)",
  description: "Use this only if a parent has multiple children at the school OR you didn't include parent rows in the Students CSV. Links guardians to students by admission number.",
  dependsOn: ["students"],
  fields: [
    { key: "name",         label: "Guardian name", required: true, example: "Rajesh Sharma", hints: [/^name$/i] },
    { key: "email",        label: "Email",         required: true, example: "rajesh@gmail.com", hints: [/email/i] },
    { key: "relation",     label: "Relation",      required: true, example: "Father",        hints: [/relation/i] },
    { key: "phone",        label: "Phone",         required: false,example: "+91 98xxx",     hints: [/phone|mobile/i] },
    { key: "studentAdmNos",label: "Student adm nos",required: true,example: "ADM-2024-001;ADM-2024-002", hints: [/student|admission|child/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.name || !r.email || !r.studentAdmNos) throw new Error("name, email, studentAdmNos required");
        const admNos = r.studentAdmNos.split(/[;,|]/).map((s) => s.trim()).filter(Boolean);
        const students = await prisma.student.findMany({ where: { schoolId, admissionNo: { in: admNos } } });
        if (students.length === 0) throw new Error(`no students matched: ${admNos.join(",")}`);
        const email = r.email.toLowerCase().trim();
        let u = await prisma.user.findUnique({ where: { email } });
        if (!u) {
          u = await prisma.user.create({
            data: {
              schoolId, email, name: r.name, phone: r.phone || null,
              password: await bcrypt.hash(email.split("@")[0], 10),
              role: "PARENT", active: true,
            },
          });
        }
        let guardian = await prisma.guardian.findUnique({ where: { userId: u.id } });
        if (!guardian) {
          guardian = await prisma.guardian.create({ data: { schoolId, userId: u.id, relation: r.relation } });
        }
        for (const stu of students) {
          await prisma.guardianStudent.create({
            data: { guardianId: guardian.id, studentId: stu.id, isPrimary: false },
          }).catch(() => {});
        }
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

// ── Tier 2 + 3 — small helpers shared across importers ─────────────────────

// Parse a paise integer from either rupees ("100.50") or paise ("10050"). The
// MCB / Tally exports are inconsistent; default heuristic: if the number has
// a decimal, treat as rupees. The Tier 1 import explicitly documents "amount
// in paise" but we accept rupees too because users will absolutely paste them.
function parsePaise(v: string): number {
  const s = String(v ?? "").replace(/[,₹\s]/g, "").trim();
  if (!s) return 0;
  if (s.includes(".")) return Math.round(Number(s) * 100);
  const n = Number(s);
  if (!Number.isFinite(n)) return 0;
  // Heuristic: < 100000 we assume rupees (most fee amounts), else paise.
  return n < 100000 ? Math.round(n * 100) : Math.round(n);
}
function parseInt0(v: string): number {
  const n = parseInt(String(v ?? "").replace(/[,\s]/g, ""), 10);
  return Number.isFinite(n) ? n : 0;
}
function parseDate(v: string): Date | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(+d) ? null : d;
}
async function classByName(schoolId: string, name: string) {
  if (!name) return null;
  const exact = await prisma.class.findFirst({ where: { schoolId, name } });
  if (exact) return exact;
  const m = name.match(/(\d+)\s*[-–]?\s*([A-Za-z])/);
  if (m) return prisma.class.findFirst({ where: { schoolId, grade: m[1], section: m[2].toUpperCase() } });
  return null;
}
async function studentByAdmNo(schoolId: string, admNo: string) {
  if (!admNo) return null;
  return prisma.student.findFirst({ where: { schoolId, admissionNo: admNo.trim() } });
}
async function staffByEmpId(schoolId: string, empId: string) {
  if (!empId) return null;
  return prisma.staff.findFirst({ where: { schoolId, employeeId: empId.trim() } });
}

// ── Tier 2 ────────────────────────────────────────────────────────────────

const FEE_STRUCTURES: EntityDef = {
  key: "fee_structures", tier: 2, status: "ready",
  label: "Fee structures",
  description: "Per-class tuition + transport + lab fees with academic-year scoping.",
  dependsOn: ["classes"],
  fields: [
    { key: "name", label: "Name", required: true, example: "Tuition 2024-25", hints: [/^name$|fee[\s_-]?(name|head)/i] },
    { key: "amount", label: "Amount (₹)", required: true, example: "120000", hints: [/amount|fee|total/i] },
    { key: "className", label: "Class", required: false, example: "Grade 8 - A", hints: [/class|grade/i] },
    { key: "academicYear", label: "Academic year", required: true, example: "2024-2025", hints: [/year|^ay$|academic/i] },
    { key: "category", label: "Category", required: false, example: "TUITION", hints: [/category|type/i] },
    { key: "dueDate", label: "Due date", required: false, example: "2024-07-15", hints: [/due/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.name) throw new Error("name is required");
        if (!r.academicYear) throw new Error("academicYear is required");
        const amount = parsePaise(r.amount);
        if (amount <= 0) throw new Error("amount must be > 0");
        const cls = r.className ? await classByName(schoolId, r.className) : null;
        if (r.className && !cls) throw new Error(`unknown class: ${r.className}`);
        const dup = await prisma.feeStructure.findFirst({
          where: { schoolId, name: r.name, academicYear: r.academicYear, classId: cls?.id ?? null },
        });
        if (dup) { out.skipped++; continue; }
        await prisma.feeStructure.create({
          data: {
            schoolId, name: r.name, amount,
            academicYear: r.academicYear,
            category: (r.category || "TUITION").toUpperCase(),
            classId: cls?.id ?? null,
            dueDate: parseDate(r.dueDate) ?? new Date(),
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const SALARY_STRUCTURES: EntityDef = {
  key: "salary_structures", tier: 2, status: "ready",
  label: "Staff salary structures",
  description: "Basic + HRA + DA + special + transport per staff member.",
  dependsOn: ["staff"],
  fields: [
    { key: "employeeId", label: "Employee ID", required: true, example: "EMP-021", hints: [/emp(loyee)?[\s_-]?id|staff[\s_-]?id/i] },
    { key: "basic", label: "Basic (₹)", required: true, example: "30000", hints: [/^basic$/i] },
    { key: "hra", label: "HRA (₹)", required: false, example: "12000", hints: [/^hra$/i] },
    { key: "da", label: "DA (₹)", required: false, example: "0", hints: [/^da$/i] },
    { key: "special", label: "Special (₹)", required: false, example: "5000", hints: [/special/i] },
    { key: "transport", label: "Transport (₹)", required: false, example: "1600", hints: [/transport|conveyance/i] },
    { key: "pfPct", label: "PF %", required: false, example: "12", hints: [/pf|provident/i] },
    { key: "esiPct", label: "ESI %", required: false, example: "0.75", hints: [/esi/i] },
    { key: "tdsMonthly", label: "TDS / month (₹)", required: false, example: "0", hints: [/tds/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const staff = await staffByEmpId(schoolId, r.employeeId);
        if (!staff) throw new Error(`no staff: ${r.employeeId}`);
        const basic = parsePaise(r.basic);
        if (basic <= 0) throw new Error("basic must be > 0");
        const dup = await prisma.salaryStructure.findFirst({ where: { staffId: staff.id } });
        if (dup) { out.skipped++; continue; }
        await prisma.salaryStructure.create({
          data: {
            schoolId, staffId: staff.id,
            basic,
            hra: parsePaise(r.hra), da: parsePaise(r.da),
            special: parsePaise(r.special), transport: parsePaise(r.transport),
            pfPct: r.pfPct ? Number(r.pfPct) : 12,
            esiPct: r.esiPct ? Number(r.esiPct) : 0.75,
            tdsMonthly: parsePaise(r.tdsMonthly),
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const BUSES: EntityDef = {
  key: "buses", tier: 2, status: "ready",
  label: "Buses + drivers",
  description: "Bus number, capacity, optional driver / conductor employee IDs.",
  dependsOn: ["staff"],
  fields: [
    { key: "number", label: "Bus number", required: true, example: "KA-01-AB-1234", hints: [/^number$|reg|bus[\s_-]?no/i] },
    { key: "capacity", label: "Capacity", required: true, example: "40", hints: [/capacity|seats/i] },
    { key: "model", label: "Model", required: false, example: "Tata Marcopolo", hints: [/model|make/i] },
    { key: "driverEmpId", label: "Driver emp ID", required: false, example: "EMP-D-01", hints: [/driver/i] },
    { key: "conductorEmpId", label: "Conductor emp ID", required: false, example: "EMP-C-01", hints: [/conductor|attendant/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.number) throw new Error("number is required");
        const cap = parseInt0(r.capacity);
        if (cap <= 0) throw new Error("capacity must be > 0");
        const dup = await prisma.bus.findFirst({ where: { schoolId, number: r.number } });
        if (dup) { out.skipped++; continue; }
        const driver = r.driverEmpId ? await staffByEmpId(schoolId, r.driverEmpId) : null;
        const conductor = r.conductorEmpId ? await staffByEmpId(schoolId, r.conductorEmpId) : null;
        await prisma.bus.create({
          data: {
            schoolId, number: r.number, capacity: cap,
            model: r.model || null,
            driverId: driver?.id ?? null,
            conductorId: conductor?.id ?? null,
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const ROUTES: EntityDef = {
  key: "routes", tier: 2, status: "ready",
  label: "Routes + stops",
  description: "One row per stop. Rows are grouped by routeName and ordered by sequence. The first row of each route also sets startTime/endTime.",
  dependsOn: ["buses"],
  fields: [
    { key: "routeName", label: "Route name", required: true, example: "South Loop", hints: [/route/i] },
    { key: "stopName", label: "Stop name", required: true, example: "MG Road", hints: [/stop|halt/i] },
    { key: "sequence", label: "Stop sequence", required: true, example: "1", hints: [/seq|order|^no$/i] },
    { key: "pickupTime", label: "Pickup time", required: false, example: "07:30", hints: [/pickup|onward|in/i] },
    { key: "dropTime", label: "Drop time", required: false, example: "15:30", hints: [/drop|return|out/i] },
    { key: "lat", label: "Latitude", required: false, example: "12.971", hints: [/^lat/i] },
    { key: "lng", label: "Longitude", required: false, example: "77.594", hints: [/^lng|^long/i] },
    { key: "busNumber", label: "Bus number", required: false, example: "KA-01-AB-1234", hints: [/bus|vehicle/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    // Group rows by route name.
    const byRoute = new Map<string, Record<string, string>[]>();
    for (const r of rows) {
      const key = (r.routeName || "").trim();
      if (!key) continue;
      const arr = byRoute.get(key) ?? [];
      arr.push(r);
      byRoute.set(key, arr);
    }

    let rowIdx = 1;
    for (const [name, stops] of byRoute) {
      try {
        stops.sort((a, b) => parseInt0(a.sequence) - parseInt0(b.sequence));
        const first = stops[0];
        const last = stops[stops.length - 1];
        const startTime = first.pickupTime || "07:30";
        const endTime = last.dropTime || last.pickupTime || "15:30";

        let route = await prisma.route.findFirst({ where: { schoolId, name } });
        if (!route) {
          route = await prisma.route.create({ data: { schoolId, name, startTime, endTime } });
        } else {
          // Wipe + rewrite stops (idempotent re-import).
          await prisma.routeStop.deleteMany({ where: { routeId: route.id } });
        }

        for (const s of stops) {
          if (!s.stopName) continue;
          await prisma.routeStop.create({
            data: {
              routeId: route.id,
              name: s.stopName,
              sequence: parseInt0(s.sequence),
              pickupTime: s.pickupTime || startTime,
              dropTime: s.dropTime || endTime,
              lat: Number(s.lat) || 0,
              lng: Number(s.lng) || 0,
            },
          });
        }
        out.created += stops.length;

        // Optional: link to a bus by number (first row wins).
        if (first.busNumber) {
          const bus = await prisma.bus.findFirst({ where: { schoolId, number: first.busNumber } });
          if (bus && bus.routeId !== route.id) {
            await prisma.bus.update({ where: { id: bus.id }, data: { routeId: route.id } }).catch(() => {});
          }
        }
      } catch (e: any) {
        out.errors.push({ row: rowIdx + 1, reason: `route '${name}': ${e?.message ?? String(e)}` });
      }
      rowIdx += stops.length;
    }
    return out;
  },
};

const INVENTORY_ITEMS: EntityDef = {
  key: "inventory_items", tier: 2, status: "ready",
  label: "Inventory items",
  description: "SKU + name + opening stock + reorder level.",
  dependsOn: [],
  fields: [
    { key: "sku", label: "SKU", required: true, example: "STN-PEN-01", hints: [/^sku$|^code$/i] },
    { key: "name", label: "Item", required: true, example: "Blue ink pen", hints: [/^name$|item/i] },
    { key: "category", label: "Category", required: false, example: "Stationery", hints: [/category/i] },
    { key: "unit", label: "Unit", required: false, example: "piece", hints: [/^unit$|uom/i] },
    { key: "qtyOnHand", label: "Qty on hand", required: true, example: "200", hints: [/qty|stock|onhand/i] },
    { key: "reorderLevel", label: "Reorder at", required: false, example: "20", hints: [/reorder|min[\s_-]?stock/i] },
    { key: "unitCost", label: "Unit cost (₹)", required: false, example: "10", hints: [/cost|price/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.sku) throw new Error("sku is required");
        if (!r.name) throw new Error("name is required");
        const dup = await prisma.inventoryItem.findFirst({ where: { schoolId, sku: r.sku } });
        if (dup) { out.skipped++; continue; }
        await prisma.inventoryItem.create({
          data: {
            schoolId, sku: r.sku, name: r.name,
            category: r.category || "General",
            unit: r.unit || "piece",
            qtyOnHand: parseInt0(r.qtyOnHand),
            reorderLevel: parseInt0(r.reorderLevel),
            unitCost: parsePaise(r.unitCost),
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const BOOKS: EntityDef = {
  key: "books", tier: 2, status: "ready",
  label: "Library books",
  description: "ISBN + title + author + total/available copies. One row per title.",
  dependsOn: [],
  fields: [
    { key: "isbn", label: "ISBN", required: false, example: "9780140449266", hints: [/isbn/i] },
    { key: "title", label: "Title", required: true, example: "The Republic", hints: [/title|^name$/i] },
    { key: "author", label: "Author", required: false, example: "Plato", hints: [/author/i] },
    { key: "publisher", label: "Publisher", required: false, example: "Penguin", hints: [/publisher/i] },
    { key: "category", label: "Category", required: false, example: "Reference", hints: [/category|type/i] },
    { key: "language", label: "Language", required: false, example: "English", hints: [/language|lang/i] },
    { key: "totalCopies", label: "Total copies", required: false, example: "3", hints: [/total|copies/i] },
    { key: "shelfCode", label: "Shelf code", required: false, example: "A-12", hints: [/shelf|rack|location/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.title) throw new Error("title is required");
        const total = Math.max(parseInt0(r.totalCopies) || 1, 1);
        const dup = r.isbn
          ? await prisma.book.findFirst({ where: { schoolId, isbn: r.isbn } })
          : await prisma.book.findFirst({ where: { schoolId, title: r.title, author: r.author || null } });
        if (dup) { out.skipped++; continue; }
        const book = await prisma.book.create({
          data: {
            schoolId,
            isbn: r.isbn || null,
            title: r.title,
            author: r.author || null,
            publisher: r.publisher || null,
            category: r.category || null,
            language: r.language || "English",
            totalCopies: total,
            availableCopies: total,
            shelfCode: r.shelfCode || null,
          },
        });
        // Spawn one BookCopy per total — barcode = ISBN-#i fallback.
        for (let c = 1; c <= total; c++) {
          const barcode = `${(r.isbn || book.id).slice(0, 16)}-${String(c).padStart(3, "0")}`;
          await prisma.bookCopy.create({ data: { bookId: book.id, barcode } }).catch(() => {});
        }
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const VENDORS: EntityDef = {
  key: "vendors", tier: 2, status: "ready",
  label: "Vendors (TDS-relevant)",
  description: "Name + PAN + GSTIN + default TDS section. Used by Finance / Compliance.",
  dependsOn: [],
  fields: [
    { key: "name", label: "Vendor name", required: true, example: "Acme Supplies", hints: [/^name$|vendor/i] },
    { key: "contact", label: "Contact person", required: false, example: "Anil Sharma", hints: [/contact|owner|representative/i] },
    { key: "email", label: "Email", required: false, example: "anil@acme.com", hints: [/email/i] },
    { key: "phone", label: "Phone", required: false, example: "+91 98xxx", hints: [/phone|mobile/i] },
    { key: "pan", label: "PAN", required: false, example: "ABCDE1234F", hints: [/^pan$/i] },
    { key: "gstin", label: "GSTIN", required: false, example: "29ABCDE1234F1Z2", hints: [/gstin|gst/i] },
    { key: "address", label: "Address", required: false, example: "12 MG Rd, Bangalore", hints: [/address/i] },
    { key: "defaultTdsSection", label: "Default TDS section", required: false, example: "194C", hints: [/tds|section/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.name) throw new Error("name is required");
        const dup = r.pan
          ? await prisma.vendor.findFirst({ where: { schoolId, pan: r.pan } })
          : await prisma.vendor.findFirst({ where: { schoolId, name: r.name } });
        if (dup) { out.skipped++; continue; }
        await prisma.vendor.create({
          data: {
            schoolId, name: r.name,
            contact: r.contact || null,
            email: r.email || null,
            phone: r.phone || null,
            pan: (r.pan || "").toUpperCase() || null,
            gstin: (r.gstin || "").toUpperCase() || null,
            address: r.address || null,
            defaultTdsSection: r.defaultTdsSection || null,
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const ORG_TAX_PROFILE: EntityDef = {
  key: "org_tax_profile", tier: 2, status: "ready",
  label: "Org tax profile",
  description: "Single row — PAN/TAN/GSTIN/12A and signatory details for the school. Re-uploading replaces existing.",
  dependsOn: [],
  fields: [
    { key: "legalName", label: "Legal name", required: true, example: "ABC Educational Trust", hints: [/legal|trust|society/i] },
    { key: "pan", label: "PAN", required: false, example: "AABCT1234A", hints: [/^pan$/i] },
    { key: "tan", label: "TAN", required: false, example: "BLRA12345B", hints: [/^tan$/i] },
    { key: "gstin", label: "GSTIN", required: false, example: "29AABCT1234A1Z5", hints: [/gstin/i] },
    { key: "cin", label: "CIN", required: false, example: "U80300KA2010NPL054321", hints: [/^cin$/i] },
    { key: "orgType", label: "Org type", required: false, example: "TRUST", hints: [/type|nature/i] },
    { key: "pfEstablishmentCode", label: "PF code", required: false, example: "KNRPC1234567", hints: [/pf/i] },
    { key: "esicCode", label: "ESIC code", required: false, example: "12345678", hints: [/esi/i] },
    { key: "ptRegNo", label: "PT reg #", required: false, example: "PT-KA-001", hints: [/professional|^pt$/i] },
    { key: "bankAccountIfsc", label: "Bank IFSC", required: false, example: "HDFC0000123", hints: [/ifsc/i] },
    { key: "bankAccountNo", label: "Bank A/C #", required: false, example: "00112345678", hints: [/account|a\/c/i] },
    { key: "responsiblePersonName", label: "Signatory", required: false, example: "Ms Rao", hints: [/signatory|principal/i] },
    { key: "responsiblePersonDesignation", label: "Signatory designation", required: false, example: "Principal", hints: [/designation/i] },
    { key: "signatoryPan", label: "Signatory PAN", required: false, example: "AAAAA1111B", hints: [/sign.*pan/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    if (rows.length === 0) return out;
    if (rows.length > 1) out.errors.push({ row: 0, reason: "expected at most one row; using the first" });
    const r = rows[0];
    try {
      if (!r.legalName) throw new Error("legalName is required");
      const existing = await prisma.orgTaxProfile.findUnique({ where: { schoolId } });
      const data = {
        legalName: r.legalName,
        pan: r.pan?.toUpperCase() || null,
        tan: r.tan?.toUpperCase() || null,
        gstin: r.gstin?.toUpperCase() || null,
        cin: r.cin?.toUpperCase() || null,
        orgType: (r.orgType || "TRUST").toUpperCase(),
        pfEstablishmentCode: r.pfEstablishmentCode || null,
        esicCode: r.esicCode || null,
        ptRegNo: r.ptRegNo || null,
        bankAccountIfsc: r.bankAccountIfsc?.toUpperCase() || null,
        bankAccountNo: r.bankAccountNo || null,
        responsiblePersonName: r.responsiblePersonName || null,
        responsiblePersonDesignation: r.responsiblePersonDesignation || null,
        signatoryPan: r.signatoryPan?.toUpperCase() || null,
      };
      if (existing) {
        await prisma.orgTaxProfile.update({ where: { schoolId }, data });
        out.skipped++;
      } else {
        await prisma.orgTaxProfile.create({ data: { schoolId, ...data } });
        out.created++;
      }
    } catch (e: any) {
      out.errors.push({ row: 2, reason: e?.message ?? String(e) });
    }
    return out;
  },
};

// ── Tier 3 ────────────────────────────────────────────────────────────────

const INVOICES: EntityDef = {
  key: "invoices", tier: 3, status: "ready",
  label: "Past invoices",
  description: "Outstanding (or paid) invoices from your previous system. One row per invoice header.",
  dependsOn: ["students", "fee_structures"],
  fields: [
    { key: "number", label: "Invoice number", required: true, example: "INV-2024-001", hints: [/number|invoice|bill/i] },
    { key: "studentAdmNo", label: "Student adm no", required: true, example: "ADM-2024-001", hints: [/student|admission/i] },
    { key: "issueDate", label: "Issue date", required: true, example: "2024-07-01", hints: [/issue|date|created/i] },
    { key: "dueDate", label: "Due date", required: true, example: "2024-07-15", hints: [/due/i] },
    { key: "total", label: "Total (₹)", required: true, example: "120000", hints: [/total|amount|grand/i] },
    { key: "amountPaid", label: "Amount paid (₹)", required: false, example: "0", hints: [/paid/i] },
    { key: "discount", label: "Discount (₹)", required: false, example: "0", hints: [/discount|concession/i] },
    { key: "tax", label: "Tax (₹)", required: false, example: "0", hints: [/^tax$|gst/i] },
    { key: "description", label: "Line description", required: false, example: "Tuition Q1 2024-25", hints: [/description|particulars|head/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.number) throw new Error("number is required");
        const stu = await studentByAdmNo(schoolId, r.studentAdmNo);
        if (!stu) throw new Error(`unknown student: ${r.studentAdmNo}`);
        const issue = parseDate(r.issueDate); const due = parseDate(r.dueDate);
        if (!issue || !due) throw new Error("issueDate and dueDate are required");
        const total = parsePaise(r.total);
        if (total <= 0) throw new Error("total must be > 0");
        const dup = await prisma.invoice.findFirst({ where: { schoolId, number: r.number } });
        if (dup) { out.skipped++; continue; }
        const paid = parsePaise(r.amountPaid);
        const status = paid >= total ? "PAID" : paid > 0 ? "PARTIAL" : (due < new Date() ? "OVERDUE" : "ISSUED");
        const inv = await prisma.invoice.create({
          data: {
            schoolId, studentId: stu.id, number: r.number,
            issueDate: issue, dueDate: due,
            subtotal: total - parsePaise(r.tax),
            discount: parsePaise(r.discount),
            tax: parsePaise(r.tax),
            total, amountPaid: paid, status,
          },
        });
        if (r.description) {
          await prisma.invoiceLine.create({
            data: { invoiceId: inv.id, description: r.description, amount: total },
          });
        }
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const PAYMENTS: EntityDef = {
  key: "payments", tier: 3, status: "ready",
  label: "Past payments",
  description: "Receipts received in your previous system. Updates the matched invoice's amountPaid + status.",
  dependsOn: ["invoices"],
  fields: [
    { key: "invoiceNumber", label: "Invoice number", required: false, example: "INV-2024-001", hints: [/invoice|bill/i] },
    { key: "studentAdmNo", label: "Student adm no", required: false, example: "ADM-2024-001", hints: [/student|admission/i] },
    { key: "receiptNo", label: "Receipt number", required: true, example: "RCP-2024-001", hints: [/receipt|^no$/i] },
    { key: "amount", label: "Amount (₹)", required: true, example: "120000", hints: [/amount|paid/i] },
    { key: "method", label: "Method", required: true, example: "RAZORPAY", hints: [/method|mode|via/i] },
    { key: "txnRef", label: "Txn ref", required: false, example: "pay_LxxxR", hints: [/txn|ref|transaction/i] },
    { key: "paidAt", label: "Paid on", required: true, example: "2024-07-10", hints: [/paid|date/i] },
    { key: "notes", label: "Notes", required: false, example: "Online", hints: [/notes|remark/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.receiptNo) throw new Error("receiptNo is required");
        const amount = parsePaise(r.amount);
        if (amount <= 0) throw new Error("amount must be > 0");
        const dup = await prisma.payment.findFirst({ where: { schoolId, receiptNo: r.receiptNo } });
        if (dup) { out.skipped++; continue; }
        let invoiceId: string | null = null;
        if (r.invoiceNumber) {
          const inv = await prisma.invoice.findFirst({ where: { schoolId, number: r.invoiceNumber } });
          if (!inv) throw new Error(`unknown invoice: ${r.invoiceNumber}`);
          invoiceId = inv.id;
        }
        await prisma.$transaction(async (tx) => {
          await tx.payment.create({
            data: {
              schoolId, invoiceId, receiptNo: r.receiptNo,
              amount, method: (r.method || "CASH").toUpperCase(),
              status: "SUCCESS",
              txnRef: r.txnRef || null,
              paidAt: parseDate(r.paidAt) ?? new Date(),
              notes: r.notes || null,
            },
          });
          if (invoiceId) {
            const inv = await tx.invoice.findUnique({ where: { id: invoiceId } });
            if (inv) {
              const newPaid = (inv.amountPaid || 0) + amount;
              const status = newPaid >= inv.total ? "PAID" : newPaid > 0 ? "PARTIAL" : inv.status;
              await tx.invoice.update({ where: { id: inv.id }, data: { amountPaid: newPaid, status } });
            }
          }
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const PAYSLIPS: EntityDef = {
  key: "payslips", tier: 3, status: "ready",
  label: "Past payslips",
  description: "Historical payroll for staff (or just opening balances). Idempotent on (staff, month, year).",
  dependsOn: ["staff"],
  fields: [
    { key: "employeeId", label: "Employee ID", required: true, example: "EMP-021", hints: [/emp/i] },
    { key: "month", label: "Month (1-12)", required: true, example: "4", hints: [/month/i] },
    { key: "year", label: "Year", required: true, example: "2024", hints: [/year/i] },
    { key: "workedDays", label: "Worked days", required: false, example: "30", hints: [/work|days/i] },
    { key: "lopDays", label: "LOP days", required: false, example: "0", hints: [/lop|loss/i] },
    { key: "basic", label: "Basic (₹)", required: true, example: "30000", hints: [/^basic/i] },
    { key: "hra", label: "HRA (₹)", required: false, example: "12000", hints: [/^hra/i] },
    { key: "da", label: "DA (₹)", required: false, example: "0", hints: [/^da/i] },
    { key: "special", label: "Special (₹)", required: false, example: "5000", hints: [/special/i] },
    { key: "transport", label: "Transport (₹)", required: false, example: "1600", hints: [/transport/i] },
    { key: "pf", label: "PF (₹)", required: false, example: "3600", hints: [/^pf/i] },
    { key: "esi", label: "ESI (₹)", required: false, example: "0", hints: [/esi/i] },
    { key: "pt", label: "PT (₹)", required: false, example: "200", hints: [/^pt|profess/i] },
    { key: "tds", label: "TDS (₹)", required: false, example: "0", hints: [/tds/i] },
    { key: "other", label: "Other deductions", required: false, example: "0", hints: [/other|misc/i] },
    { key: "paidAt", label: "Paid on", required: false, example: "2024-04-30", hints: [/paid|date/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const staff = await staffByEmpId(schoolId, r.employeeId);
        if (!staff) throw new Error(`no staff: ${r.employeeId}`);
        const month = parseInt0(r.month);
        const year = parseInt0(r.year);
        if (month < 1 || month > 12) throw new Error("month must be 1-12");
        if (year < 2000) throw new Error("invalid year");
        const dup = await prisma.payslip.findFirst({ where: { staffId: staff.id, month, year } });
        if (dup) { out.skipped++; continue; }
        const basic = parsePaise(r.basic), hra = parsePaise(r.hra), da = parsePaise(r.da);
        const special = parsePaise(r.special), transport = parsePaise(r.transport);
        const pf = parsePaise(r.pf), esi = parsePaise(r.esi), tds = parsePaise(r.tds);
        const pt = parsePaise(r.pt);
        const other = parsePaise(r.other);
        const gross = basic + hra + da + special + transport;
        const totalDeductions = pf + esi + pt + tds + other;
        const net = gross - totalDeductions;
        await prisma.payslip.create({
          data: {
            schoolId, staffId: staff.id, month, year,
            workedDays: parseInt0(r.workedDays) || 30,
            lopDays: parseInt0(r.lopDays),
            basic, hra, da, special, transport, gross,
            pf, esi, pt, tds, otherDeductions: other, totalDeductions,
            net, status: "PAID",
            paidAt: parseDate(r.paidAt) ?? null,
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const CLASS_ATTENDANCE: EntityDef = {
  key: "class_attendance", tier: 3, status: "ready",
  label: "Past class attendance",
  description: "Daily PRESENT / ABSENT / LATE / HALF_DAY rows per student. One row per (student, date).",
  dependsOn: ["students"],
  fields: [
    { key: "studentAdmNo", label: "Student adm no", required: true, example: "ADM-2024-001", hints: [/student|admission/i] },
    { key: "date", label: "Date", required: true, example: "2024-07-10", hints: [/date/i] },
    { key: "status", label: "Status", required: true, example: "PRESENT", hints: [/status|att/i] },
    { key: "remarks", label: "Remarks", required: false, example: "", hints: [/remark|note/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const stu = await studentByAdmNo(schoolId, r.studentAdmNo);
        if (!stu) throw new Error(`unknown student: ${r.studentAdmNo}`);
        if (!stu.classId) throw new Error(`student has no class: ${r.studentAdmNo}`);
        const date = parseDate(r.date);
        if (!date) throw new Error("date is required");
        date.setHours(0, 0, 0, 0);
        const status = (r.status || "PRESENT").toUpperCase();
        if (!["PRESENT", "ABSENT", "LATE", "HALF_DAY", "LEAVE"].includes(status)) {
          throw new Error(`unknown status: ${status}`);
        }
        const dup = await prisma.classAttendance.findFirst({
          where: { classId: stu.classId, studentId: stu.id, date },
        });
        if (dup) { out.skipped++; continue; }
        await prisma.classAttendance.create({
          data: {
            classId: stu.classId, studentId: stu.id, date, status,
            remarks: r.remarks || null,
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const STAFF_ATTENDANCE: EntityDef = {
  key: "staff_attendance", tier: 3, status: "ready",
  label: "Past staff attendance",
  description: "Daily attendance for staff. Idempotent on (staff, date).",
  dependsOn: ["staff"],
  fields: [
    { key: "employeeId", label: "Employee ID", required: true, example: "EMP-021", hints: [/emp/i] },
    { key: "date", label: "Date", required: true, example: "2024-07-10", hints: [/date/i] },
    { key: "status", label: "Status", required: true, example: "PRESENT", hints: [/status/i] },
    { key: "inTime", label: "In", required: false, example: "2024-07-10T08:55", hints: [/^in$|in[\s_-]?time|punch[\s_-]?in/i] },
    { key: "outTime", label: "Out", required: false, example: "2024-07-10T16:35", hints: [/^out$|out[\s_-]?time|punch[\s_-]?out/i] },
    { key: "hoursWorked", label: "Hours", required: false, example: "7.5", hints: [/hours/i] },
    { key: "source", label: "Source", required: false, example: "BIOMETRIC", hints: [/source|device/i] },
    { key: "note", label: "Note", required: false, example: "", hints: [/note|remark/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const staff = await staffByEmpId(schoolId, r.employeeId);
        if (!staff) throw new Error(`unknown staff: ${r.employeeId}`);
        const date = parseDate(r.date);
        if (!date) throw new Error("date is required");
        date.setHours(0, 0, 0, 0);
        const status = (r.status || "PRESENT").toUpperCase();
        if (!["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY", "WEEKEND"].includes(status)) {
          throw new Error(`unknown status: ${status}`);
        }
        const dup = await prisma.staffAttendance.findFirst({ where: { staffId: staff.id, date } });
        if (dup) { out.skipped++; continue; }
        await prisma.staffAttendance.create({
          data: {
            staffId: staff.id, date, status,
            inTime: parseDate(r.inTime),
            outTime: parseDate(r.outTime),
            hoursWorked: r.hoursWorked ? Number(r.hoursWorked) : 0,
            source: (r.source || "MANUAL").toUpperCase(),
            note: r.note || null,
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const EXAM_MARKS: EntityDef = {
  key: "exam_marks", tier: 3, status: "ready",
  label: "Past exam marks",
  description: "Marks per (exam, subject, student). Exam is matched by name within the school; subject by code.",
  dependsOn: ["students", "subjects"],
  fields: [
    { key: "examName", label: "Exam name", required: true, example: "Term 1 - 2024", hints: [/exam[\s_-]?name|^exam$|test/i] },
    { key: "subjectCode", label: "Subject code", required: true, example: "MATH", hints: [/subj(ect)?[\s_-]?code|^code$/i] },
    { key: "studentAdmNo", label: "Student adm no", required: true, example: "ADM-2024-001", hints: [/admission/i] },
    { key: "marksObtained", label: "Marks obtained", required: true, example: "78", hints: [/marks|score/i] },
    { key: "absent", label: "Absent? (Y/N)", required: false, example: "N", hints: [/absent/i] },
    { key: "grade", label: "Grade", required: false, example: "B1", hints: [/grade/i] },
    { key: "remarks", label: "Remarks", required: false, example: "", hints: [/remark|comment/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const exam = await prisma.exam.findFirst({ where: { schoolId, name: r.examName } });
        if (!exam) throw new Error(`unknown exam: ${r.examName}`);
        const subj = await prisma.subject.findFirst({ where: { schoolId, code: r.subjectCode } });
        if (!subj) throw new Error(`unknown subject: ${r.subjectCode}`);
        const exSubj = await prisma.examSubject.findFirst({ where: { examId: exam.id, subjectId: subj.id } });
        if (!exSubj) throw new Error(`subject ${r.subjectCode} not part of exam ${r.examName}`);
        const stu = await studentByAdmNo(schoolId, r.studentAdmNo);
        if (!stu) throw new Error(`unknown student: ${r.studentAdmNo}`);
        const absent = /^y(es)?$|^true$|^1$/i.test(String(r.absent || "").trim());
        const marks = absent ? 0 : parseInt0(r.marksObtained);
        const dup = await prisma.examMark.findFirst({
          where: { examSubjectId: exSubj.id, studentId: stu.id },
        });
        if (dup) { out.skipped++; continue; }
        await prisma.examMark.create({
          data: {
            examId: exam.id, examSubjectId: exSubj.id, studentId: stu.id,
            marksObtained: marks, absent,
            grade: r.grade || null, remarks: r.remarks || null,
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const BOOK_ISSUES: EntityDef = {
  key: "book_issues", tier: 3, status: "ready",
  label: "Library issue history",
  description: "Open + closed book issues. Books matched by ISBN, students by admission number.",
  dependsOn: ["books", "students"],
  fields: [
    { key: "isbn", label: "Book ISBN", required: false, example: "9780140449266", hints: [/isbn/i] },
    { key: "title", label: "Book title", required: false, example: "The Republic", hints: [/title/i] },
    { key: "studentAdmNo", label: "Student adm no", required: true, example: "ADM-2024-001", hints: [/admission/i] },
    { key: "issuedAt", label: "Issued at", required: true, example: "2024-07-10", hints: [/issue|borrow/i] },
    { key: "dueDate", label: "Due date", required: true, example: "2024-07-24", hints: [/due/i] },
    { key: "returnedAt", label: "Returned at", required: false, example: "", hints: [/return/i] },
    { key: "fineAmount", label: "Fine (₹)", required: false, example: "0", hints: [/fine/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const book = r.isbn
          ? await prisma.book.findFirst({ where: { schoolId, isbn: r.isbn } })
          : (r.title ? await prisma.book.findFirst({ where: { schoolId, title: r.title } }) : null);
        if (!book) throw new Error(`unknown book: ${r.isbn || r.title}`);
        const stu = await studentByAdmNo(schoolId, r.studentAdmNo);
        if (!stu) throw new Error(`unknown student: ${r.studentAdmNo}`);
        const issuedAt = parseDate(r.issuedAt);
        const dueDate = parseDate(r.dueDate);
        if (!issuedAt || !dueDate) throw new Error("issuedAt and dueDate are required");

        const copy = await prisma.bookCopy.findFirst({ where: { bookId: book.id, status: "AVAILABLE" } });
        if (!copy) throw new Error(`no available copy of ${book.title}`);
        const returned = parseDate(r.returnedAt);
        await prisma.$transaction(async (tx) => {
          await tx.bookIssue.create({
            data: {
              schoolId, bookId: book.id, copyId: copy.id, studentId: stu.id,
              issuedAt, dueDate,
              returnedAt: returned,
              fineAmount: parsePaise(r.fineAmount),
              finePaid: parsePaise(r.fineAmount) === 0,
            },
          });
          if (!returned) {
            await tx.bookCopy.update({ where: { id: copy.id }, data: { status: "ISSUED" } });
            await tx.book.update({
              where: { id: book.id },
              data: { availableCopies: { decrement: 1 } },
            });
          }
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const VENDOR_TDS: EntityDef = {
  key: "vendor_tds", tier: 3, status: "ready",
  label: "Vendor TDS deductions",
  description: "194C / J / I / H / A deductions per vendor per quarter. Idempotent on (vendor, certificateNo).",
  dependsOn: ["vendors"],
  fields: [
    { key: "vendorName", label: "Vendor name", required: true, example: "Acme Supplies", hints: [/vendor|^name$|payee/i] },
    { key: "section", label: "Section", required: true, example: "194C", hints: [/section/i] },
    { key: "natureOfPayment", label: "Nature of payment", required: false, example: "Contractor", hints: [/nature|particular/i] },
    { key: "grossAmount", label: "Gross amount (₹)", required: true, example: "100000", hints: [/gross|amount/i] },
    { key: "tdsRate", label: "TDS rate %", required: true, example: "1", hints: [/rate/i] },
    { key: "tdsAmount", label: "TDS amount (₹)", required: false, example: "1000", hints: [/tds[\s_-]?amount|deducted/i] },
    { key: "panFurnished", label: "PAN furnished?", required: false, example: "Y", hints: [/pan/i] },
    { key: "paidAt", label: "Paid on", required: true, example: "2024-07-10", hints: [/paid|date/i] },
    { key: "quarter", label: "Quarter (1-4)", required: true, example: "1", hints: [/quarter|^q$/i] },
    { key: "year", label: "FY start year", required: true, example: "2024", hints: [/year/i] },
    { key: "certificateNo", label: "Form 16A serial", required: false, example: "TDS-194C-001", hints: [/cert|serial|16a/i] },
    { key: "invoiceRef", label: "Invoice ref", required: false, example: "PO-1001", hints: [/invoice|po|ref/i] },
    { key: "notes", label: "Notes", required: false, example: "", hints: [/note|remark/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        const vendor = await prisma.vendor.findFirst({ where: { schoolId, name: r.vendorName } });
        if (!vendor) throw new Error(`unknown vendor: ${r.vendorName}`);
        const gross = parsePaise(r.grossAmount);
        if (gross <= 0) throw new Error("grossAmount must be > 0");
        const rate = Number(r.tdsRate || 0);
        const tdsAmt = parsePaise(r.tdsAmount) || Math.round(gross * rate / 100);
        const quarter = parseInt0(r.quarter);
        const year = parseInt0(r.year);
        if (quarter < 1 || quarter > 4) throw new Error("quarter must be 1-4");
        if (year < 2000) throw new Error("invalid year");
        if (r.certificateNo) {
          const dup = await prisma.vendorTdsDeduction.findFirst({
            where: { schoolId, vendorId: vendor.id, certificateNo: r.certificateNo },
          });
          if (dup) { out.skipped++; continue; }
        }
        await prisma.vendorTdsDeduction.create({
          data: {
            schoolId, vendorId: vendor.id,
            invoiceRef: r.invoiceRef || null,
            section: r.section.toUpperCase(),
            natureOfPayment: r.natureOfPayment || r.section,
            grossAmount: gross,
            tdsRate: rate,
            tdsAmount: tdsAmt,
            netAmount: gross - tdsAmt,
            panFurnished: !/^n(o)?$|false|0/i.test(String(r.panFurnished || "Y")),
            paidAt: parseDate(r.paidAt) ?? new Date(),
            quarter, year,
            certificateNo: r.certificateNo || null,
            notes: r.notes || null,
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

const QUESTION_BANK: EntityDef = {
  key: "question_bank", tier: 2, status: "ready",
  label: "Question bank",
  description: "Bulk-import quiz/test questions. Options are pipe-separated; correct is a 0-based index list (or text for FILL/DESCRIPTIVE).",
  dependsOn: [],
  fields: [
    { key: "text",       label: "Question text",   required: true,  example: "What is 2+2?", hints: [/^text$|^question$/i] },
    { key: "type",       label: "Type",            required: false, example: "MCQ",          hints: [/^type$/i] },
    { key: "options",    label: "Options (|-sep)", required: false, example: "1|2|3|4",      hints: [/option/i] },
    { key: "correct",    label: "Correct (idx CSV or text)", required: false, example: "3", hints: [/^correct/i] },
    { key: "marks",      label: "Marks",           required: false, example: "1",            hints: [/^marks$/i] },
    { key: "difficulty", label: "Difficulty",      required: false, example: "MEDIUM",       hints: [/diff/i] },
    { key: "className",  label: "Class",           required: false, example: "Grade 8 - A",  hints: [/class|grade/i] },
    { key: "subjectCode",label: "Subject code",    required: false, example: "MATH",         hints: [/subj/i] },
    { key: "chapter",    label: "Chapter",         required: false, example: "Algebra",      hints: [/chapter/i] },
    { key: "topic",      label: "Topic",           required: false, example: "Linear eqns",  hints: [/topic/i] },
    { key: "subtopic",   label: "Subtopic",        required: false, example: "Slope-intercept", hints: [/subtopic/i] },
    { key: "syllabus",   label: "Syllabus",        required: false, example: "JEE-MAIN-2025", hints: [/syllabus|board/i] },
    { key: "bloomLevel", label: "Bloom level",     required: false, example: "APPLY",        hints: [/bloom/i] },
    { key: "numericTolerance", label: "Numeric tol", required: false, example: "0.01",       hints: [/tolerance/i] },
    { key: "numericRangeMin",  label: "Numeric min", required: false, example: "5",          hints: [/range.*min|min.*range/i] },
    { key: "numericRangeMax",  label: "Numeric max", required: false, example: "10",         hints: [/range.*max|max.*range/i] },
    { key: "rubric",     label: "Rubric (JSON)",   required: false, example: '{"criteria":[]}', hints: [/rubric/i] },
    { key: "status",     label: "Status",          required: false, example: "PUBLISHED",    hints: [/status/i] },
    { key: "tags",       label: "Tags (CSV)",      required: false, example: "ncert,easy",   hints: [/tags?/i] },
  ],
  async create(rows, { schoolId }) {
    const out: ImportRunResult = { created: 0, skipped: 0, errors: [] };
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      try {
        if (!r.text) throw new Error("text is required");
        const type = (r.type || "MCQ").toUpperCase();
        if (!["MCQ", "MULTI", "TRUE_FALSE", "FILL", "NUMERIC", "DESCRIPTIVE"].includes(type)) {
          throw new Error(`bad type: ${type}`);
        }

        let options: string[] = [];
        if (type === "MCQ" || type === "MULTI") {
          options = (r.options || "").split("|").map((s) => s.trim()).filter(Boolean);
          if (options.length < 2) throw new Error("MCQ/MULTI needs at least 2 options (pipe-separated)");
        } else if (type === "TRUE_FALSE") {
          options = ["True", "False"];
        }

        let correct: any = [];
        if (type === "MCQ" || type === "MULTI" || type === "TRUE_FALSE") {
          correct = (r.correct || "")
            .split(/[,\s]+/).map((s) => Number(s.trim()))
            .filter((n) => Number.isInteger(n) && n >= 0 && n < options.length);
          if (correct.length === 0) throw new Error("correct index missing or out of range");
        } else {
          // FILL / DESCRIPTIVE
          correct = (r.correct || "").trim();
        }

        const cls = r.className ? await classByName(schoolId, r.className) : null;
        const sub = r.subjectCode ? await prisma.subject.findFirst({ where: { schoolId, code: r.subjectCode } }) : null;

        const status = ["DRAFT", "REVIEW", "PUBLISHED", "RETIRED"].includes((r.status || "").toUpperCase())
          ? (r.status as string).toUpperCase()
          : "PUBLISHED";  // Imported questions default to PUBLISHED so blueprint generator can use them
        const bloom = ["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE", "EVALUATE", "CREATE"].includes((r.bloomLevel || "").toUpperCase())
          ? (r.bloomLevel as string).toUpperCase()
          : null;

        let rubricJson: string | null = null;
        if (r.rubric && r.rubric.trim()) {
          try { rubricJson = JSON.stringify(JSON.parse(r.rubric)); } catch { rubricJson = null; }
        }

        await prisma.questionBankItem.create({
          data: {
            schoolId,
            text: r.text,
            type,
            options: JSON.stringify(options),
            correct: JSON.stringify(correct),
            marks: parseInt0(r.marks) || 1,
            difficulty: ["EASY", "MEDIUM", "HARD"].includes((r.difficulty || "").toUpperCase())
              ? (r.difficulty as string).toUpperCase()
              : "MEDIUM",
            classId: cls?.id ?? null,
            subjectId: sub?.id ?? null,
            chapter: r.chapter || null,
            topic: r.topic || null,
            subtopic: r.subtopic || null,
            syllabus: r.syllabus || null,
            bloomLevel: bloom,
            numericTolerance: r.numericTolerance ? parseFloat(r.numericTolerance) : null,
            numericRangeMin: r.numericRangeMin ? parseFloat(r.numericRangeMin) : null,
            numericRangeMax: r.numericRangeMax ? parseFloat(r.numericRangeMax) : null,
            rubric: rubricJson,
            status,
            source: "IMPORTED",
            tags: JSON.stringify((r.tags || "").split(",").map((s) => s.trim()).filter(Boolean)),
          },
        });
        out.created++;
      } catch (e: any) {
        out.errors.push({ row: i + 2, reason: e?.message ?? String(e) });
      }
    }
    return out;
  },
};

export const REGISTRY: Record<ImportEntity, EntityDef> = Object.fromEntries(
  [
    CLASSES, SUBJECTS, STAFF, STUDENTS, GUARDIANS,
    FEE_STRUCTURES, SALARY_STRUCTURES, BUSES, ROUTES, INVENTORY_ITEMS, BOOKS, VENDORS, ORG_TAX_PROFILE,
    INVOICES, PAYMENTS, PAYSLIPS, CLASS_ATTENDANCE, STAFF_ATTENDANCE, EXAM_MARKS, BOOK_ISSUES, VENDOR_TDS,
    QUESTION_BANK,
  ].map((e) => [e.key, e]),
) as Record<ImportEntity, EntityDef>;

export function entitiesInTier(tier: Tier) {
  return Object.values(REGISTRY).filter((e) => e.tier === tier);
}
