import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

const FIRST_M = ["Aarav", "Vihaan", "Aditya", "Arjun", "Reyansh", "Krishna", "Ishaan", "Vivaan", "Rohan", "Kabir", "Ayaan", "Dhruv", "Karthik", "Manav", "Neel", "Pranav", "Rishi", "Shaurya", "Tanish", "Yash"];
const FIRST_F = ["Aanya", "Diya", "Aadhya", "Saanvi", "Anika", "Myra", "Pari", "Avni", "Kiara", "Riya", "Ira", "Mahi", "Navya", "Prisha", "Sara", "Tanvi", "Vanya", "Zara", "Anvi", "Bhavya"];
const SUR = ["Sharma", "Patel", "Iyer", "Reddy", "Verma", "Gupta", "Mehta", "Nair", "Singh", "Kumar", "Rao", "Joshi", "Kulkarni", "Pillai", "Menon", "Shetty", "Banerjee", "Das", "Khanna", "Saxena"];
const FATHER_F = ["Rajesh", "Suresh", "Mahesh", "Anil", "Vinod", "Ramesh", "Naveen", "Sandeep", "Praveen", "Manoj", "Deepak", "Ashok", "Vijay", "Sanjay", "Pradeep"];
const MOTHER_F = ["Sunita", "Anita", "Kavita", "Meera", "Priya", "Rekha", "Lakshmi", "Pooja", "Nisha", "Sangeeta", "Shobha", "Geeta", "Radha", "Smita", "Asha"];

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pad(n: number, w = 4) { return String(n).padStart(w, "0"); }

const HASH = bcrypt.hashSync("demo1234", 10);

async function main() {
  console.log("⏳ Wiping existing data...");
  // delete in dependency order
  await db.notification.deleteMany();
  await db.announcement.deleteMany();
  await db.payslip.deleteMany();
  await db.salaryStructure.deleteMany();
  await db.purchaseOrderLine.deleteMany();
  await db.purchaseOrder.deleteMany();
  await db.vendor.deleteMany();
  await db.stockMovement.deleteMany();
  await db.inventoryItem.deleteMany();
  await db.payment.deleteMany();
  await db.invoiceLine.deleteMany();
  await db.invoice.deleteMany();
  await db.feeStructure.deleteMany();
  await db.busAttendance.deleteMany();
  await db.gPSPing.deleteMany();
  await db.bus.deleteMany();
  await db.routeStop.deleteMany();
  await db.route.deleteMany();
  await db.classAttendance.deleteMany();
  await db.submission.deleteMany();
  await db.assignment.deleteMany();
  await db.subject.deleteMany();
  await db.guardianStudent.deleteMany();
  await db.guardian.deleteMany();
  await db.student.deleteMany();
  await db.staff.deleteMany();
  await db.class.deleteMany();
  await db.user.deleteMany();
  await db.school.deleteMany();

  console.log("🏫 Creating school...");
  const school = await db.school.create({
    data: {
      name: "Lakshya School of Excellence",
      code: "LSE",
      city: "Bangalore",
      state: "Karnataka",
      pincode: "560066",
      phone: "+91 80 4042 9999",
      email: "office@dpsbangalore.edu.in",
      academicYear: "2026-2027",
    },
  });
  const sId = school.id;

  console.log("👤 Creating administrative users...");
  async function mkUser(email: string, name: string, role: string, phone?: string) {
    return db.user.create({
      data: { schoolId: sId, email, name, role, password: HASH, phone },
    });
  }

  const admin     = await mkUser("admin@dpsbangalore.edu.in",     "Mr. Sudhir Anand",     "ADMIN",             "+91 98453 11122");
  const principal = await mkUser("principal@dpsbangalore.edu.in", "Dr. Latha Krishnan",   "PRINCIPAL",         "+91 98453 11123");
  const accountantU = await mkUser("accounts@dpsbangalore.edu.in", "Mrs. Geetha Murthy",   "ACCOUNTANT",        "+91 98453 11124");
  const transportU  = await mkUser("transport@dpsbangalore.edu.in", "Mr. Manjunath Gowda", "TRANSPORT_MANAGER", "+91 98453 11125");
  const hrU         = await mkUser("hr@dpsbangalore.edu.in",       "Mrs. Vidya Hegde",     "HR_MANAGER",        "+91 98453 11126");
  const inventoryU  = await mkUser("inventory@dpsbangalore.edu.in", "Mr. Praveen Bhat",   "INVENTORY_MANAGER", "+91 98453 11127");

  // create staff records for non-teaching admin staff so payroll works
  const adminStaff = await db.staff.create({
    data: { schoolId: sId, userId: admin.id, employeeId: "EMP0001", designation: "School Administrator",
            department: "Administration", joiningDate: new Date("2018-04-01"), pan: "ABCDE1234A", bankAccount: "50100123456789", ifsc: "HDFC0000123" },
  });
  const principalStaff = await db.staff.create({
    data: { schoolId: sId, userId: principal.id, employeeId: "EMP0002", designation: "Principal",
            department: "Administration", joiningDate: new Date("2015-06-01"), qualification: "Ph.D. Education", pan: "ABCDE1235A" },
  });
  const accountantStaff = await db.staff.create({
    data: { schoolId: sId, userId: accountantU.id, employeeId: "EMP0003", designation: "Accountant",
            department: "Finance", joiningDate: new Date("2019-08-15"), qualification: "M.Com" },
  });
  const transportStaff = await db.staff.create({
    data: { schoolId: sId, userId: transportU.id, employeeId: "EMP0004", designation: "Transport Manager",
            department: "Operations", joiningDate: new Date("2020-01-10") },
  });
  const hrStaff = await db.staff.create({
    data: { schoolId: sId, userId: hrU.id, employeeId: "EMP0005", designation: "HR Manager",
            department: "HR", joiningDate: new Date("2019-04-01") },
  });
  const inventoryStaff = await db.staff.create({
    data: { schoolId: sId, userId: inventoryU.id, employeeId: "EMP0006", designation: "Inventory Manager",
            department: "Operations", joiningDate: new Date("2021-07-01") },
  });

  console.log("👨‍🏫 Creating teachers...");
  const teacherDefs = [
    { name: "Ms. Ananya Iyer",      email: "ananya.iyer@dpsbangalore.edu.in",      subj: "Mathematics", qual: "M.Sc. Mathematics, B.Ed." },
    { name: "Mr. Rohit Kulkarni",   email: "rohit.kulkarni@dpsbangalore.edu.in",   subj: "Physics",     qual: "M.Sc. Physics, B.Ed." },
    { name: "Mrs. Priya Menon",     email: "priya.menon@dpsbangalore.edu.in",      subj: "English",     qual: "M.A. English, B.Ed." },
    { name: "Mr. Arvind Rao",       email: "arvind.rao@dpsbangalore.edu.in",       subj: "Chemistry",   qual: "M.Sc. Chemistry, B.Ed." },
    { name: "Ms. Divya Nair",       email: "divya.nair@dpsbangalore.edu.in",       subj: "Biology",     qual: "M.Sc. Botany, B.Ed." },
    { name: "Mr. Karthik Reddy",    email: "karthik.reddy@dpsbangalore.edu.in",    subj: "Computer Science", qual: "M.Tech CSE" },
    { name: "Mrs. Shobha Pillai",   email: "shobha.pillai@dpsbangalore.edu.in",    subj: "Hindi",       qual: "M.A. Hindi, B.Ed." },
    { name: "Mr. Suresh Gupta",     email: "suresh.gupta@dpsbangalore.edu.in",     subj: "Social Studies", qual: "M.A. History, B.Ed." },
    { name: "Ms. Kavya Shetty",     email: "kavya.shetty@dpsbangalore.edu.in",     subj: "Kannada",     qual: "M.A. Kannada, B.Ed." },
    { name: "Mr. Deepak Joshi",     email: "deepak.joshi@dpsbangalore.edu.in",     subj: "Physical Education", qual: "M.P.Ed." },
  ];
  const teacherStaffs: { staff: any; subject: string }[] = [];
  for (let i = 0; i < teacherDefs.length; i++) {
    const t = teacherDefs[i];
    const u = await mkUser(t.email, t.name, "TEACHER", `+91 9845${pad(i + 22000, 5)}`);
    const s = await db.staff.create({
      data: {
        schoolId: sId, userId: u.id, employeeId: `EMP${pad(i + 10, 4)}`,
        designation: "Teacher", department: "Academics",
        joiningDate: new Date(2020 + (i % 4), (i * 2) % 12, 5 + i),
        qualification: t.qual,
      },
    });
    teacherStaffs.push({ staff: s, subject: t.subj });
  }

  console.log("🚌 Creating drivers & conductors...");
  const transportCrew: any[] = [];
  for (let i = 0; i < 12; i++) {
    const isDriver = i < 6;
    const u = await mkUser(
      `${isDriver ? "driver" : "conductor"}${i + 1}@dpsbangalore.edu.in`,
      `${isDriver ? "Mr." : ""} ${rand(SUR)} ${rand(["Naidu","Gowda","Yadav","Ali","Kumar","Singh"])}`.trim(),
      "TRANSPORT_MANAGER", `+91 9845${pad(i + 30000, 5)}`,
    );
    const s = await db.staff.create({
      data: {
        schoolId: sId, userId: u.id, employeeId: `EMP${pad(i + 100, 4)}`,
        designation: isDriver ? "Bus Driver" : "Bus Conductor",
        department: "Transport",
        joiningDate: new Date(2021, i % 12, 1 + (i % 20)),
      },
    });
    transportCrew.push(s);
  }

  console.log("🏛️  Creating classes & subjects...");
  const classDefs = [
    { grade: "6",  section: "A", theme: "pink"     },
    { grade: "7",  section: "A", theme: "peach"    },
    { grade: "8",  section: "A", theme: "rose"     },
    { grade: "8",  section: "B", theme: "lavender" },
    { grade: "9",  section: "A", theme: "mint"     },
    { grade: "10", section: "A", theme: "sky"      },
    { grade: "11", section: "A", theme: "sand"     },
    { grade: "12", section: "A", theme: "sage"     },
  ];
  const classes: any[] = [];
  const ananyaTeacher = teacherStaffs.find((t) => t.subject === "Mathematics")!.staff;
  for (let i = 0; i < classDefs.length; i++) {
    const def = classDefs[i];
    // class teacher assignment — round-robin teachers
    const ct = teacherStaffs[i % teacherStaffs.length].staff;
    const cls = await db.class.create({
      data: {
        schoolId: sId, name: `Grade ${def.grade}-${def.section}`,
        grade: def.grade, section: def.section,
        classTeacherId: ct.id,
        theme: def.theme,
      },
    });
    classes.push(cls);

    // subjects: 6 per class — Math + Eng + Sci/Soc Studies + 2nd lang + 1 elective
    const subs = [
      { name: "Mathematics", code: "MATH", subj: "Mathematics" },
      { name: "English",     code: "ENG",  subj: "English" },
      { name: "Science",     code: "SCI",  subj: "Physics" },
      { name: "Social Studies", code: "SOC", subj: "Social Studies" },
      { name: "Hindi",       code: "HIN",  subj: "Hindi" },
      { name: "Computer Science", code: "CS", subj: "Computer Science" },
    ];
    for (const sub of subs) {
      const teacher = teacherStaffs.find((t) => t.subject === sub.subj)?.staff ?? ananyaTeacher;
      await db.subject.create({
        data: { schoolId: sId, classId: cls.id, name: sub.name, code: sub.code, teacherId: teacher.id },
      });
    }
  }
  // Make Ms. Ananya the class teacher for Grade 8-A specifically (so her demo login lands on an interesting class)
  const grade8A = classes.find((c) => c.grade === "8" && c.section === "A")!;
  await db.class.update({ where: { id: grade8A.id }, data: { classTeacherId: ananyaTeacher.id } });

  console.log("🚍 Creating routes, stops, buses (Bangalore neighbourhoods)...");
  // Real-ish Bangalore neighbourhoods — coords approximate
  const routesData = [
    {
      name: "Route 1 — Whitefield Loop", startTime: "06:45", endTime: "08:15",
      stops: [
        { name: "ITPL Main Gate",       lat: 12.9858, lng: 77.7368, t: ["07:05","15:25"] },
        { name: "Hope Farm Junction",   lat: 12.9893, lng: 77.7470, t: ["07:15","15:35"] },
        { name: "Whitefield Railway Stn", lat: 12.9954, lng: 77.7348, t: ["07:25","15:45"] },
        { name: "Varthur Kodi",         lat: 12.9412, lng: 77.7411, t: ["07:35","15:55"] },
      ],
    },
    {
      name: "Route 2 — Marathahalli & HAL", startTime: "06:50", endTime: "08:10",
      stops: [
        { name: "Marathahalli Bridge",  lat: 12.9591, lng: 77.6974, t: ["07:00","15:30"] },
        { name: "Brookefield Mall",     lat: 12.9669, lng: 77.7180, t: ["07:10","15:40"] },
        { name: "Kundalahalli Gate",    lat: 12.9690, lng: 77.7066, t: ["07:20","15:50"] },
        { name: "HAL Old Airport Rd",   lat: 12.9608, lng: 77.6580, t: ["07:30","16:00"] },
      ],
    },
    {
      name: "Route 3 — Indiranagar & Domlur", startTime: "06:40", endTime: "08:00",
      stops: [
        { name: "100 Feet Road",        lat: 12.9784, lng: 77.6408, t: ["06:55","15:25"] },
        { name: "Indiranagar Metro",    lat: 12.9783, lng: 77.6408, t: ["07:05","15:35"] },
        { name: "Domlur Flyover",       lat: 12.9606, lng: 77.6378, t: ["07:15","15:45"] },
        { name: "Old Madras Road",      lat: 12.9899, lng: 77.6603, t: ["07:25","15:55"] },
      ],
    },
    {
      name: "Route 4 — Koramangala & HSR", startTime: "06:55", endTime: "08:20",
      stops: [
        { name: "HSR Layout Sector 7",  lat: 12.9082, lng: 77.6476, t: ["07:10","15:30"] },
        { name: "Forum Mall Koramangala", lat: 12.9344, lng: 77.6126, t: ["07:20","15:40"] },
        { name: "Sony World Junction",  lat: 12.9304, lng: 77.6272, t: ["07:30","15:50"] },
      ],
    },
    {
      name: "Route 5 — Sarjapur Road", startTime: "06:35", endTime: "08:10",
      stops: [
        { name: "Wipro Corporate Office", lat: 12.9046, lng: 77.6884, t: ["06:50","15:25"] },
        { name: "Bellandur Junction",   lat: 12.9258, lng: 77.6760, t: ["07:00","15:35"] },
        { name: "Iblur Junction",       lat: 12.9239, lng: 77.6711, t: ["07:10","15:45"] },
        { name: "Carmelaram",           lat: 12.9008, lng: 77.7186, t: ["07:20","15:55"] },
      ],
    },
    {
      name: "Route 6 — Hebbal & Yelahanka", startTime: "06:30", endTime: "08:25",
      stops: [
        { name: "Hebbal Flyover",       lat: 13.0358, lng: 77.5970, t: ["06:50","15:30"] },
        { name: "Yelahanka New Town",   lat: 13.1007, lng: 77.5963, t: ["07:05","15:45"] },
        { name: "Jakkur Aerodrome",     lat: 13.0784, lng: 77.6048, t: ["07:20","16:00"] },
      ],
    },
  ];
  const buses: any[] = [];
  const stopsAll: any[] = [];
  for (let i = 0; i < routesData.length; i++) {
    const rd = routesData[i];
    const route = await db.route.create({
      data: { schoolId: sId, name: rd.name, startTime: rd.startTime, endTime: rd.endTime, km: 18 + i * 4 },
    });
    for (let j = 0; j < rd.stops.length; j++) {
      const s = rd.stops[j];
      const stop = await db.routeStop.create({
        data: {
          routeId: route.id, name: s.name, sequence: j + 1,
          pickupTime: s.t[0], dropTime: s.t[1], lat: s.lat, lng: s.lng,
        },
      });
      stopsAll.push(stop);
    }
    const bus = await db.bus.create({
      data: {
        schoolId: sId, number: `KA-01-AB-${1200 + i * 13}`,
        capacity: 40 + i * 4, model: i % 2 ? "Tata LP 1109" : "Eicher Skyline Pro",
        routeId: route.id,
        driverId: transportCrew[i].id,
        conductorId: transportCrew[i + 6].id,
      },
    });
    buses.push(bus);
  }

  console.log("🎒 Creating students + parents (this may take a moment)...");
  const allStudents: any[] = [];
  let studentSeq = 1;
  for (const cls of classes) {
    const count = randInt(18, 24);
    for (let r = 1; r <= count; r++) {
      const isMale = Math.random() > 0.45;
      const first = rand(isMale ? FIRST_M : FIRST_F);
      const sur = rand(SUR);
      const fullName = `${first} ${sur}`;
      const email = `${first.toLowerCase()}.${sur.toLowerCase()}${studentSeq === 1 && cls.grade === "8" && cls.section === "A" ? "" : studentSeq}@dpsbangalore.edu.in`;
      // First student of Grade 8-A is the canonical demo student "Aarav Sharma"
      const useDemoEmail = (cls.grade === "8" && cls.section === "A" && r === 1);
      const finalEmail = useDemoEmail ? "aarav.sharma@dpsbangalore.edu.in" : `${first.toLowerCase()}.${sur.toLowerCase()}.${studentSeq}@dpsbangalore.edu.in`;
      const finalName = useDemoEmail ? "Aarav Sharma" : fullName;
      const stuUser = await db.user.create({
        data: { schoolId: sId, email: finalEmail, password: HASH, name: finalName, role: "STUDENT" },
      });
      const dobYear = 2026 - (parseInt(cls.grade) + 5);
      const stop = stopsAll[Math.floor(Math.random() * stopsAll.length)];
      const stu = await db.student.create({
        data: {
          schoolId: sId, userId: stuUser.id,
          admissionNo: `DPS${pad(studentSeq, 5)}`,
          rollNo: pad(r, 2),
          classId: cls.id,
          section: cls.section,
          dob: new Date(dobYear, randInt(0,11), randInt(1,28)),
          gender: isMale ? "MALE" : "FEMALE",
          bloodGroup: rand(["A+","B+","O+","AB+","A-","O-"]),
          address: `${randInt(1,400)}, ${rand(["Whitefield","Marathahalli","HSR Layout","Koramangala","Indiranagar","Hebbal","Sarjapur","Bellandur"])}, Bangalore`,
          busStopId: Math.random() > 0.2 ? stop.id : null,
        },
      });
      allStudents.push({ student: stu, user: stuUser, classId: cls.id });

      // Create primary parent (father)
      const fatherFirst = useDemoEmail ? "Rajesh" : rand(FATHER_F);
      const fatherEmail = useDemoEmail ? "rajesh.sharma@gmail.com" : `${fatherFirst.toLowerCase()}.${sur.toLowerCase()}.${studentSeq}@gmail.com`;
      const fatherUser = await db.user.create({
        data: { schoolId: sId, email: fatherEmail, password: HASH, name: `${fatherFirst} ${sur}`, role: "PARENT", phone: `+91 98${pad(studentSeq + 100000, 8)}` },
      });
      const father = await db.guardian.create({
        data: { schoolId: sId, userId: fatherUser.id, relation: "Father", occupation: rand(["Software Engineer","Doctor","Banker","Business","Civil Servant","Architect","Consultant"]) },
      });
      await db.guardianStudent.create({ data: { guardianId: father.id, studentId: stu.id, isPrimary: true } });

      studentSeq++;
    }
  }
  console.log(`   created ${allStudents.length} students`);

  console.log("📚 Creating assignments + submissions...");
  const allAssignments: any[] = [];
  const sampleAssignments: Record<string, { title: string; desc: string }[]> = {
    Mathematics: [
      { title: "Linear Equations Practice", desc: "Solve problems 1-15 from chapter 3. Show your work." },
      { title: "Quadratic Equations Test", desc: "Read section 10.4, then complete attached worksheet." },
      { title: "Trigonometry Worksheet",  desc: "Practice problems on sine, cosine and tangent ratios." },
    ],
    English: [
      { title: "Essay: My Role Model",     desc: "Write a 500-word essay on a person who inspires you." },
      { title: "Poetry Analysis: Stopping by Woods", desc: "Analyse Frost's poem and submit a one-page response." },
    ],
    Science: [
      { title: "Light Reflection Lab Report", desc: "Document the lab experiment with diagrams and conclusions." },
      { title: "Newton's Laws — Quiz", desc: "30-minute quiz covering all three laws of motion." },
    ],
    "Social Studies": [
      { title: "Indian Constitution Project", desc: "Group project on fundamental rights and duties." },
    ],
    Hindi: [
      { title: "कविता का सार",            desc: "दी गई कविता का भावार्थ अपने शब्दों में लिखें।" },
    ],
    "Computer Science": [
      { title: "Build a To-Do List App",   desc: "Use HTML, CSS and JavaScript to build a working to-do app." },
      { title: "Python Loops Practice",    desc: "Solve 10 problems using for and while loops." },
    ],
  };
  for (const cls of classes) {
    const subjects = await db.subject.findMany({ where: { classId: cls.id } });
    for (const subject of subjects) {
      const samples = sampleAssignments[subject.name] ?? [];
      for (let k = 0; k < samples.length; k++) {
        const sample = samples[k];
        const dueOffset = randInt(-5, 14); // some past, some future
        const a = await db.assignment.create({
          data: {
            classId: cls.id,
            subjectId: subject.id,
            teacherId: subject.teacherId!,
            title: sample.title,
            description: sample.desc,
            type: k === 1 ? "QUIZ" : "ASSIGNMENT",
            status: "PUBLISHED",
            maxPoints: 100,
            dueAt: new Date(Date.now() + dueOffset * 86400000),
          },
        });
        allAssignments.push({ a, classId: cls.id });
      }
    }
  }

  // create submissions for each assignment for each student
  for (const { a, classId } of allAssignments) {
    const studentsInClass = allStudents.filter((s) => s.classId === classId);
    for (const { student } of studentsInClass) {
      const r = Math.random();
      let status = "ASSIGNED", submittedAt = null as any, grade: number | null = null, gradedAt: any = null;
      const isPast = a.dueAt && a.dueAt < new Date();
      if (isPast) {
        if (r < 0.55) {
          status = "GRADED"; submittedAt = new Date(a.dueAt.getTime() - 86400000); grade = randInt(60, 98); gradedAt = new Date();
        } else if (r < 0.8) {
          status = "TURNED_IN"; submittedAt = new Date(a.dueAt.getTime() - 3600_000);
        } else {
          status = "MISSING";
        }
      } else if (r < 0.25) {
        status = "TURNED_IN"; submittedAt = new Date();
      }
      await db.submission.create({
        data: {
          assignmentId: a.id, studentId: student.id, status,
          submittedAt, grade, gradedAt,
          feedback: status === "GRADED" ? rand(["Great work!","Well structured.","Needs improvement on conclusion.","Excellent effort."]) : null,
        },
      });
    }
  }

  console.log("📝 Class attendance (last 14 days)...");
  for (const cls of classes) {
    const studentsInClass = allStudents.filter((s) => s.classId === cls.id);
    for (let d = 0; d < 14; d++) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      day.setHours(0,0,0,0);
      if (day.getDay() === 0) continue; // Sunday
      for (const { student } of studentsInClass) {
        const r = Math.random();
        const status = r < 0.92 ? "PRESENT" : r < 0.96 ? "ABSENT" : "LATE";
        await db.classAttendance.create({
          data: { classId: cls.id, studentId: student.id, date: day, status, markedById: cls.classTeacherId },
        });
      }
    }
  }

  console.log("💸 Fee structures + invoices + payments...");
  // Per-class fee structure
  for (const cls of classes) {
    const tuition = parseInt(cls.grade) >= 9 ? 4500000 : parseInt(cls.grade) >= 6 ? 3800000 : 3200000;
    const transport = 1500000;
    const lab = parseInt(cls.grade) >= 9 ? 800000 : 500000;
    const exam = 600000;
    const dueDate = new Date(); dueDate.setDate(15); dueDate.setMonth(dueDate.getMonth() + 1);
    await db.feeStructure.create({ data: { schoolId: sId, classId: cls.id, name: "Q2 Tuition", academicYear: "2026-2027", amount: tuition, dueDate, category: "Tuition" } });
    await db.feeStructure.create({ data: { schoolId: sId, classId: cls.id, name: "Q2 Transport", academicYear: "2026-2027", amount: transport, dueDate, category: "Transport" } });
    await db.feeStructure.create({ data: { schoolId: sId, classId: cls.id, name: "Q2 Lab Fee", academicYear: "2026-2027", amount: lab, dueDate, category: "Lab" } });
    await db.feeStructure.create({ data: { schoolId: sId, classId: cls.id, name: "Q2 Exam Fee", academicYear: "2026-2027", amount: exam, dueDate, category: "Exam" } });
  }

  let invSeq = 1, rcptSeq = 1;
  for (const { student, classId } of allStudents) {
    const fees = await db.feeStructure.findMany({ where: { classId } });
    const lines = fees.map((f) => ({ description: f.name, amount: f.amount, feeStructureId: f.id }));
    const subtotal = lines.reduce((s, l) => s + l.amount, 0);
    const dueDate = new Date(); dueDate.setDate(15); dueDate.setMonth(dueDate.getMonth() + 1);
    const r = Math.random();
    let status: "PAID" | "PARTIAL" | "ISSUED" | "OVERDUE" = "ISSUED";
    let amountPaid = 0;
    if (r < 0.6) { status = "PAID"; amountPaid = subtotal; }
    else if (r < 0.75) { status = "PARTIAL"; amountPaid = Math.round(subtotal / 2 / 1000) * 1000; }
    else if (r < 0.9) { status = "ISSUED"; }
    else { status = "OVERDUE"; }

    const invoice = await db.invoice.create({
      data: {
        schoolId: sId, studentId: student.id,
        number: `INV-2026-${pad(invSeq++)}`,
        dueDate, subtotal, total: subtotal, amountPaid, status,
        lines: { create: lines },
      },
    });
    if (amountPaid > 0) {
      await db.payment.create({
        data: {
          schoolId: sId, invoiceId: invoice.id,
          receiptNo: `RCP-2026-${pad(rcptSeq++)}`,
          amount: amountPaid,
          method: rand(["UPI","RAZORPAY","NETBANKING","CASH","CHEQUE"]),
          paidAt: new Date(Date.now() - randInt(0, 30) * 86400000),
          txnRef: `pay_${Math.random().toString(36).slice(2, 14)}`,
        },
      });
    }
  }

  console.log("📦 Inventory items + vendors + POs...");
  const items = [
    { sku: "STAT-001", name: "A4 Paper Ream (500 sheets)", cat: "Stationery", unit: "ream", qty: 120, cost: 28000, reorder: 30 },
    { sku: "STAT-002", name: "Whiteboard Marker (Black)",  cat: "Stationery", unit: "pcs",  qty: 240, cost: 4500,  reorder: 50 },
    { sku: "STAT-003", name: "Chalk Box (100 pcs)",        cat: "Stationery", unit: "box",  qty: 18,  cost: 12000, reorder: 20 },
    { sku: "STAT-004", name: "Notebook (200 pages)",        cat: "Stationery", unit: "pcs",  qty: 320, cost: 8500,  reorder: 100 },
    { sku: "LAB-001",  name: "Beaker 500ml Borosilicate",  cat: "Lab",        unit: "pcs",  qty: 45,  cost: 22000, reorder: 15 },
    { sku: "LAB-002",  name: "Bunsen Burner",              cat: "Lab",        unit: "pcs",  qty: 12,  cost: 95000, reorder: 5 },
    { sku: "LAB-003",  name: "Microscope Compound 40x-1000x", cat: "Lab",     unit: "pcs",  qty: 8,   cost: 850000, reorder: 2 },
    { sku: "SPRT-001", name: "Cricket Ball",                cat: "Sports",     unit: "pcs",  qty: 35,  cost: 18000, reorder: 10 },
    { sku: "SPRT-002", name: "Football (Size 5)",           cat: "Sports",     unit: "pcs",  qty: 12,  cost: 65000, reorder: 5 },
    { sku: "SPRT-003", name: "Badminton Shuttlecock (10)",  cat: "Sports",     unit: "box",  qty: 22,  cost: 35000, reorder: 8 },
    { sku: "CLN-001",  name: "Phenyl 5L",                   cat: "Cleaning",   unit: "ltr",  qty: 28,  cost: 32000, reorder: 10 },
    { sku: "CLN-002",  name: "Toilet Paper Roll (12-pack)", cat: "Cleaning",   unit: "pack", qty: 14,  cost: 42000, reorder: 5 },
    { sku: "CLN-003",  name: "Hand Sanitizer 1L",           cat: "Cleaning",   unit: "ltr",  qty: 36,  cost: 28000, reorder: 15 },
    { sku: "FUR-001",  name: "Student Bench (3-seater)",    cat: "Furniture",  unit: "pcs",  qty: 4,   cost: 950000, reorder: 2 },
    { sku: "ELEC-001", name: "LED Tube Light 18W",          cat: "Electrical", unit: "pcs",  qty: 60,  cost: 18000, reorder: 20 },
    { sku: "ELEC-002", name: "Ceiling Fan 1200mm",          cat: "Electrical", unit: "pcs",  qty: 8,   cost: 280000, reorder: 5 },
    { sku: "ELEC-003", name: "Extension Cord 5m",           cat: "Electrical", unit: "pcs",  qty: 22,  cost: 42000, reorder: 8 },
    { sku: "FOOD-001", name: "Mid-day Meal Rice (50kg)",    cat: "Food",       unit: "bag",  qty: 6,   cost: 285000, reorder: 4 },
    { sku: "FOOD-002", name: "Cooking Oil 15L",             cat: "Food",       unit: "ltr",  qty: 9,   cost: 215000, reorder: 4 },
    { sku: "MED-001",  name: "First Aid Kit",               cat: "Medical",    unit: "pcs",  qty: 8,   cost: 65000, reorder: 4 },
  ];
  const itemRecords: any[] = [];
  for (const it of items) {
    const rec = await db.inventoryItem.create({
      data: { schoolId: sId, sku: it.sku, name: it.name, category: it.cat, unit: it.unit, qtyOnHand: it.qty, unitCost: it.cost, reorderLevel: it.reorder },
    });
    itemRecords.push(rec);
    // Initial stock-in movement
    await db.stockMovement.create({ data: { itemId: rec.id, type: "IN", qty: it.qty, reason: "Opening balance", createdAt: new Date(Date.now() - 60 * 86400000) } });
  }

  const vendors = [
    { name: "Sapna Stationers Pvt Ltd", contact: "Rakesh Sharma", email: "sales@sapnastationers.in", phone: "+91 80 4099 1234", gstin: "29ABCDE1234F1Z5", address: "Avenue Road, Bangalore" },
    { name: "Bangalore Lab Equipment Co.", contact: "Suresh Bhat", email: "info@blec.in", phone: "+91 80 2345 6789", gstin: "29ABCDE5678F1Z5", address: "JC Road, Bangalore" },
    { name: "Decathlon Sports India", contact: "Priya Nair", email: "b2b@decathlon.in", phone: "+91 98453 22222", gstin: "29ABCDE9012F1Z5" },
    { name: "Reliance Cleaning Supplies", contact: "Manjunath", email: "orders@rcs.in", phone: "+91 90080 11122", gstin: "29ABCDE3456F1Z5" },
    { name: "Karnataka Furniture Works", contact: "Chandrashekar", email: "kfw@karfurn.in", phone: "+91 99000 33333" },
  ];
  const vendorRecords: any[] = [];
  for (const v of vendors) {
    vendorRecords.push(await db.vendor.create({ data: { schoolId: sId, ...v } }));
  }
  // 4 sample POs
  for (let p = 0; p < 4; p++) {
    const v = vendorRecords[p % vendorRecords.length];
    const itemsToBuy = itemRecords.filter((i) => i.qtyOnHand <= i.reorderLevel + 5).slice(0, 3 + p);
    if (itemsToBuy.length === 0) continue;
    const lines = itemsToBuy.map((it) => ({ itemId: it.id, qty: 50, unitCost: it.unitCost }));
    const total = lines.reduce((s, l) => s + l.qty * l.unitCost, 0);
    await db.purchaseOrder.create({
      data: {
        schoolId: sId, vendorId: v.id,
        number: `PO-2026-${pad(p + 1)}`,
        status: p < 2 ? "ISSUED" : p < 3 ? "PARTIAL" : "RECEIVED",
        total,
        expectedAt: new Date(Date.now() + 7 * 86400000),
        lines: { create: lines },
      },
    });
  }

  console.log("💼 Salary structures + payslips (last 3 months)...");
  const allStaff = await db.staff.findMany({ where: { schoolId: sId } });
  for (const st of allStaff) {
    const isLeader = ["Principal","School Administrator","HR Manager"].includes(st.designation);
    const isTeacher = st.designation === "Teacher";
    const isDriver = ["Bus Driver","Bus Conductor"].includes(st.designation);
    const basic = isLeader ? 8500000 : isTeacher ? 4500000 : isDriver ? 1800000 : 3200000;
    const hra = Math.round(basic * 0.4);
    const da = Math.round(basic * 0.1);
    const special = isLeader ? 1500000 : 500000;
    const transport = 160000;
    await db.salaryStructure.create({
      data: { schoolId: sId, staffId: st.id, basic, hra, da, special, transport },
    });
    for (let m = 0; m < 3; m++) {
      const d = new Date(); d.setMonth(d.getMonth() - m);
      const gross = basic + hra + da + special + transport;
      const pf = Math.round(basic * 0.12);
      const esi = gross < 2500000 ? Math.round(gross * 0.0075) : 0;
      const tds = isLeader ? Math.round(gross * 0.1) : isTeacher ? Math.round(gross * 0.05) : 0;
      const totalDeductions = pf + esi + tds;
      const net = gross - totalDeductions;
      await db.payslip.create({
        data: {
          schoolId: sId, staffId: st.id,
          month: d.getMonth() + 1, year: d.getFullYear(),
          workedDays: 30, lopDays: 0,
          basic, hra, da, special, transport, gross,
          pf, esi, tds, totalDeductions, net,
          status: m === 0 ? "FINALISED" : "PAID",
          paidAt: m === 0 ? null : new Date(d.getFullYear(), d.getMonth(), 28),
        },
      });
    }
  }

  console.log("📣 Announcements + notifications...");
  const anns = [
    { title: "PTM scheduled for Saturday, 03 May 2026",
      body: "Parent-Teacher meetings will be held this Saturday from 9:00 AM to 1:00 PM. Please carry your wards' progress card.",
      audience: "PARENTS", pinned: true },
    { title: "Annual Sports Day — Save the date!",
      body: "Our Annual Sports Day will be held on 15th May 2026. Practice sessions begin next week.",
      audience: "ALL", pinned: true },
    { title: "Holiday: Buddha Purnima",
      body: "School will remain closed on 23 May 2026 on account of Buddha Purnima.",
      audience: "ALL" },
    { title: "Q2 Fee Reminder",
      body: "Kindly ensure Q2 fees are paid before 15th of next month to avoid late charges.",
      audience: "PARENTS" },
    { title: "New CBSE Chemistry textbook adopted",
      body: "Grade 11 and 12 will switch to the updated NCERT Chemistry textbook starting next term.",
      audience: "STUDENTS" },
    { title: "Staff Wellness Workshop — 10 May",
      body: "All faculty are invited to a wellness workshop in the auditorium at 4 PM.",
      audience: "STAFF" },
  ];
  for (const a of anns) {
    await db.announcement.create({
      data: { schoolId: sId, authorId: principal.id, ...a },
    });
  }

  console.log("📍 Initial GPS pings (one per bus, near route start)...");
  for (let i = 0; i < buses.length; i++) {
    const stops = await db.routeStop.findMany({ where: { routeId: buses[i].routeId! }, orderBy: { sequence: "asc" } });
    if (stops.length === 0) continue;
    await db.gPSPing.create({
      data: { busId: buses[i].id, lat: stops[0].lat, lng: stops[0].lng, speedKmh: 0, heading: 0 },
    });
  }

  console.log("\n✅ Seed complete.");
  console.log("   School:", school.name);
  console.log("   Students:", allStudents.length);
  console.log("   Classes:", classes.length);
  console.log("   Buses:", buses.length);
  console.log("\nDemo logins (password = demo1234):");
  console.log("   admin@dpsbangalore.edu.in");
  console.log("   principal@dpsbangalore.edu.in");
  console.log("   ananya.iyer@dpsbangalore.edu.in       (Teacher, Grade 8-A class teacher)");
  console.log("   aarav.sharma@dpsbangalore.edu.in      (Student, Grade 8-A)");
  console.log("   rajesh.sharma@gmail.com               (Parent, Aarav's father)");
  console.log("   accounts@dpsbangalore.edu.in          (Accountant)");
  console.log("   transport@dpsbangalore.edu.in         (Transport Manager)");
  console.log("   hr@dpsbangalore.edu.in                (HR/Inventory)");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await db.$disconnect(); });
