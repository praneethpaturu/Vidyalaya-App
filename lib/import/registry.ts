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
  | "staff_attendance" | "exam_marks" | "book_issues" | "vendor_tds";

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

// ── Tier 2 + 3 — declared but not implemented yet ──────────────────────────
function comingSoon(key: ImportEntity, tier: Tier, label: string, description: string, dependsOn: ImportEntity[], fields: FieldDef[]): EntityDef {
  return { key, tier, status: "coming-soon", label, description, dependsOn, fields };
}

const COMING: EntityDef[] = [
  comingSoon("fee_structures",  2, "Fee structures", "Per-class tuition + transport + lab fees with academic-year scoping.", ["classes"], [
    { key: "name", label: "Name", required: true, example: "Tuition 2024-25", hints: [/name/i] },
    { key: "amount", label: "Amount (paise)", required: true, example: "12000000", hints: [/amount|fee/i] },
    { key: "className", label: "Class", required: false, example: "Grade 8 - A", hints: [/class|grade/i] },
    { key: "academicYear", label: "Academic year", required: true, example: "2024-2025", hints: [/year|ay/i] },
    { key: "category", label: "Category", required: false, example: "TUITION", hints: [/category|type/i] },
    { key: "dueDate", label: "Due date", required: false, example: "2024-07-15", hints: [/due/i] },
  ]),
  comingSoon("salary_structures", 2, "Staff salary structures", "Basic + HRA + DA + special + transport per staff member.", ["staff"], [
    { key: "employeeId", label: "Employee ID", required: true, example: "EMP-021", hints: [/emp/i] },
    { key: "basic", label: "Basic", required: true, example: "30000", hints: [/basic/i] },
    { key: "hra", label: "HRA", required: true, example: "12000", hints: [/hra/i] },
    { key: "da", label: "DA", required: false, example: "0", hints: [/da/i] },
    { key: "special", label: "Special", required: false, example: "5000", hints: [/special/i] },
    { key: "transport", label: "Transport", required: false, example: "1600", hints: [/transport/i] },
  ]),
  comingSoon("buses", 2, "Buses + drivers", "Bus number, route name, driver employee id.", ["staff"], [
    { key: "number", label: "Bus number", required: true, example: "KA-01-AB-1234", hints: [/number|reg/i] },
    { key: "capacity", label: "Capacity", required: true, example: "40", hints: [/capacity|seats/i] },
    { key: "driverEmpId", label: "Driver emp ID", required: false, example: "EMP-D-01", hints: [/driver/i] },
  ]),
  comingSoon("routes", 2, "Routes + stops", "One row per stop. Stops grouped by routeName, ordered by sequence.", ["buses"], [
    { key: "routeName", label: "Route name", required: true, example: "South Loop", hints: [/route/i] },
    { key: "stopName", label: "Stop name", required: true, example: "MG Road", hints: [/stop/i] },
    { key: "sequence", label: "Stop sequence", required: true, example: "1", hints: [/seq|order/i] },
    { key: "lat", label: "Latitude", required: false, example: "12.971", hints: [/lat/i] },
    { key: "lng", label: "Longitude", required: false, example: "77.594", hints: [/lng|long/i] },
  ]),
  comingSoon("inventory_items", 2, "Inventory items", "SKU + name + stock + reorder level.", [], [
    { key: "sku", label: "SKU", required: true, example: "STN-PEN-01", hints: [/sku/i] },
    { key: "name", label: "Item", required: true, example: "Blue ink pen", hints: [/name|item/i] },
    { key: "qtyOnHand", label: "Qty on hand", required: true, example: "200", hints: [/qty|stock/i] },
    { key: "reorderLevel", label: "Reorder at", required: false, example: "20", hints: [/reorder/i] },
  ]),
  comingSoon("books", 2, "Library books", "ISBN + title + author + total/available copies.", [], [
    { key: "isbn", label: "ISBN", required: true, example: "9780140449266", hints: [/isbn/i] },
    { key: "title", label: "Title", required: true, example: "The Republic", hints: [/title|name/i] },
    { key: "author", label: "Author", required: true, example: "Plato", hints: [/author/i] },
    { key: "totalCopies", label: "Total copies", required: false, example: "3", hints: [/copies|total/i] },
  ]),
  comingSoon("vendors", 2, "Vendors (TDS-relevant)", "Name + PAN + GSTIN + default TDS section.", [], [
    { key: "name", label: "Vendor name", required: true, example: "Acme Supplies", hints: [/name/i] },
    { key: "pan", label: "PAN", required: false, example: "ABCDE1234F", hints: [/pan/i] },
    { key: "gstin", label: "GSTIN", required: false, example: "29ABCDE1234F1Z2", hints: [/gstin|gst/i] },
    { key: "defaultTdsSection", label: "Default TDS section", required: false, example: "194C", hints: [/tds|section/i] },
  ]),
  comingSoon("invoices", 3, "Past invoices", "Outstanding invoices from your previous system.", ["students", "fee_structures"], [
    { key: "number", label: "Invoice number", required: true, example: "INV-2024-001", hints: [/number|invoice/i] },
    { key: "studentAdmNo", label: "Student adm no", required: true, example: "ADM-2024-001", hints: [/student|admission/i] },
    { key: "issueDate", label: "Issue date", required: true, example: "2024-07-01", hints: [/issue|date/i] },
    { key: "dueDate", label: "Due date", required: true, example: "2024-07-15", hints: [/due/i] },
    { key: "total", label: "Total (paise)", required: true, example: "12000000", hints: [/total|amount/i] },
    { key: "amountPaid", label: "Amount paid", required: false, example: "0", hints: [/paid/i] },
  ]),
  comingSoon("payments", 3, "Past payments", "Receipts received in your previous system.", ["invoices"], [
    { key: "invoiceNumber", label: "Invoice number", required: true, example: "INV-2024-001", hints: [/invoice/i] },
    { key: "receiptNo", label: "Receipt number", required: true, example: "RCP-2024-001", hints: [/receipt/i] },
    { key: "amount", label: "Amount (paise)", required: true, example: "12000000", hints: [/amount/i] },
    { key: "method", label: "Method", required: true, example: "RAZORPAY", hints: [/method|mode/i] },
    { key: "paidAt", label: "Paid on", required: true, example: "2024-07-10", hints: [/paid|date/i] },
  ]),
  comingSoon("payslips", 3, "Past payslips", "Historical payroll for staff (or just opening balances).", ["staff", "salary_structures"], []),
  comingSoon("class_attendance", 3, "Past class attendance", "Daily PRESENT/ABSENT/LATE rows per student.", ["students"], []),
  comingSoon("staff_attendance", 3, "Past staff attendance", "Daily attendance for staff.", ["staff"], []),
  comingSoon("exam_marks", 3, "Past exam marks", "Marks per student per subject per exam.", ["students", "subjects"], []),
  comingSoon("book_issues", 3, "Library issue history", "Open + closed book issues.", ["books", "students"], []),
  comingSoon("vendor_tds", 3, "Vendor TDS deductions", "194C/J/I/H/A deductions, by vendor + quarter.", ["vendors"], []),
  comingSoon("org_tax_profile", 2, "Org tax profile", "PAN/TAN/GSTIN/12A and signatory details for the school.", [], []),
];

export const REGISTRY: Record<ImportEntity, EntityDef> = Object.fromEntries(
  [CLASSES, SUBJECTS, STAFF, STUDENTS, GUARDIANS, ...COMING].map((e) => [e.key, e]),
) as Record<ImportEntity, EntityDef>;

export function entitiesInTier(tier: Tier) {
  return Object.values(REGISTRY).filter((e) => e.tier === tier);
}
