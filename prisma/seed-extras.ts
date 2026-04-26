// Seed timetable, exam (with marks), library books, and school events.
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function ri(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }

async function main() {
  console.log("⏳ Wiping previous extras data...");
  await db.examMark.deleteMany();
  await db.examSubject.deleteMany();
  await db.exam.deleteMany();
  await db.timetableEntry.deleteMany();
  await db.bookIssue.deleteMany();
  await db.bookCopy.deleteMany();
  await db.book.deleteMany();
  await db.schoolEvent.deleteMany();

  const school = await db.school.findFirst();
  if (!school) throw new Error("Run main seed first");
  const sId = school.id;

  console.log("🗓️  Timetables for all classes...");
  const classes = await db.class.findMany({ where: { schoolId: sId }, include: { subjects: true } });
  const PERIODS = [
    { p: 1, s: "08:00", e: "08:45" },
    { p: 2, s: "08:50", e: "09:35" },
    { p: 3, s: "09:40", e: "10:25" },
    { p: 4, s: "10:45", e: "11:30" },
    { p: 5, s: "11:35", e: "12:20" },
    { p: 6, s: "13:00", e: "13:45" },
  ];
  for (const cls of classes) {
    for (let day = 1; day <= 6; day++) {
      // Shuffle subjects for variety
      const subs = [...cls.subjects].sort(() => Math.random() - 0.5);
      for (let i = 0; i < PERIODS.length; i++) {
        const sub = subs[i % subs.length];
        const per = PERIODS[i];
        await db.timetableEntry.create({
          data: {
            schoolId: sId, classId: cls.id, subjectId: sub.id, teacherId: sub.teacherId,
            dayOfWeek: day, period: per.p, startTime: per.s, endTime: per.e,
            room: `R-${cls.grade}${cls.section}-${100 + day}`,
          },
        });
      }
    }
  }

  console.log("📝 Exams (Half-Yearly with marks for one class)...");
  const c8a = classes.find((c) => c.grade === "8" && c.section === "A")!;
  const subjects8a = await db.subject.findMany({ where: { classId: c8a.id } });
  const exam = await db.exam.create({
    data: {
      schoolId: sId, classId: c8a.id,
      name: "Half-Yearly 2026-27",
      type: "HALF_YEARLY",
      startDate: new Date(new Date().getFullYear(), 8, 15),
      endDate: new Date(new Date().getFullYear(), 8, 28),
      maxPerSubject: 100, passingPct: 35,
      status: "PUBLISHED",
      subjects: { create: subjects8a.map((s) => ({ subjectId: s.id, maxMarks: 100, date: new Date(new Date().getFullYear(), 8, 15 + (subjects8a.indexOf(s))) })) },
    },
    include: { subjects: true },
  });
  const students8a = await db.student.findMany({ where: { classId: c8a.id } });
  for (const stu of students8a) {
    for (const es of exam.subjects) {
      const r = Math.random();
      if (r < 0.03) {
        await db.examMark.create({ data: { examId: exam.id, examSubjectId: es.id, studentId: stu.id, marksObtained: 0, absent: true } });
      } else {
        // Skewed toward 60-90 with a tail
        const base = ri(35, 95);
        const adj = ri(-5, 8);
        const m = Math.max(0, Math.min(100, base + adj));
        await db.examMark.create({ data: { examId: exam.id, examSubjectId: es.id, studentId: stu.id, marksObtained: m, absent: false } });
      }
    }
  }

  // A planned exam for another class (so the listing isn't empty)
  const c10a = classes.find((c) => c.grade === "10" && c.section === "A")!;
  const subjects10a = await db.subject.findMany({ where: { classId: c10a.id } });
  await db.exam.create({
    data: {
      schoolId: sId, classId: c10a.id,
      name: "Pre-Board 2026",
      type: "PRE_BOARD",
      startDate: new Date(new Date().getFullYear(), 10, 5),
      endDate: new Date(new Date().getFullYear(), 10, 18),
      maxPerSubject: 80, passingPct: 33,
      status: "PLANNED",
      subjects: { create: subjects10a.map((s) => ({ subjectId: s.id, maxMarks: 80 })) },
    },
  });

  console.log("📚 Library books...");
  const bookList = [
    { title: "Wings of Fire", author: "A.P.J. Abdul Kalam", isbn: "9788173711466", category: "Biography", copies: 3, shelf: "B-12" },
    { title: "Train to Pakistan", author: "Khushwant Singh", isbn: "9780143065883", category: "Fiction", copies: 2, shelf: "F-04" },
    { title: "The Discovery of India", author: "Jawaharlal Nehru", isbn: "9780143031031", category: "History", copies: 4, shelf: "H-22" },
    { title: "NCERT Mathematics Class 8", author: "NCERT", isbn: "8174506764", category: "Textbook", copies: 25, shelf: "T-08" },
    { title: "NCERT Science Class 8", author: "NCERT", isbn: "8174505369", category: "Textbook", copies: 25, shelf: "T-08" },
    { title: "NCERT Social Science Class 8", author: "NCERT", isbn: "8174506772", category: "Textbook", copies: 25, shelf: "T-08" },
    { title: "Five Point Someone", author: "Chetan Bhagat", isbn: "9788129104595", category: "Fiction", copies: 4, shelf: "F-09" },
    { title: "Malgudi Days", author: "R.K. Narayan", isbn: "9780140183436", category: "Fiction", copies: 3, shelf: "F-15" },
    { title: "Indian Constitution", author: "P.M. Bakshi", isbn: "9789388313445", category: "Reference", copies: 5, shelf: "R-01" },
    { title: "Gitanjali", author: "Rabindranath Tagore", isbn: "9788129110589", category: "Poetry", copies: 2, shelf: "P-03" },
    { title: "Concise Oxford English Dictionary", author: "Catherine Soanes", isbn: "9780199601080", category: "Reference", copies: 6, shelf: "R-02" },
    { title: "RD Sharma Mathematics Class 10", author: "R.D. Sharma", isbn: "9789352530519", category: "Reference", copies: 8, shelf: "T-10" },
    { title: "Atomic Habits", author: "James Clear", isbn: "9781847941831", category: "Self-help", copies: 3, shelf: "S-01" },
    { title: "Sapiens", author: "Yuval Noah Harari", isbn: "9780062316097", category: "History", copies: 2, shelf: "H-25" },
    { title: "Wonder", author: "R.J. Palacio", isbn: "9780552565974", category: "Fiction", copies: 3, shelf: "F-21" },
  ];
  for (const b of bookList) {
    const book = await db.book.create({
      data: {
        schoolId: sId, isbn: b.isbn, title: b.title, author: b.author,
        category: b.category, totalCopies: b.copies, availableCopies: b.copies, shelfCode: b.shelf,
      },
    });
    for (let i = 0; i < b.copies; i++) {
      await db.bookCopy.create({ data: { bookId: book.id, barcode: `BR-${book.id.slice(-6)}-${100 + i}`, status: "AVAILABLE" } });
    }
  }

  // A few open issues so the issues page has demo data
  const someStudents = (await db.student.findMany({ where: { schoolId: sId } })).slice(0, 8);
  const someBooks = await db.book.findMany({ where: { schoolId: sId }, include: { copies: true }, take: 6 });
  for (let i = 0; i < 6; i++) {
    const book = someBooks[i];
    const copy = book.copies[0];
    if (!copy || copy.status !== "AVAILABLE") continue;
    const stu = someStudents[i];
    const issuedAt = new Date(Date.now() - ri(3, 25) * 86400000);
    const due = new Date(issuedAt.getTime() + 14 * 86400000);
    await db.bookIssue.create({
      data: { schoolId: sId, bookId: book.id, copyId: copy.id, studentId: stu.id, issuedAt, dueDate: due },
    });
    await db.bookCopy.update({ where: { id: copy.id }, data: { status: "ISSUED" } });
    await db.book.update({ where: { id: book.id }, data: { availableCopies: { decrement: 1 } } });
  }

  console.log("📅 School events...");
  const today = new Date();
  const events = [
    { d: 5,   title: "Annual Sports Day",       desc: "Inter-house athletics meet at school grounds", type: "SPORTS",   audience: "ALL",      location: "Main ground", color: "#34a853" },
    { d: 12,  title: "Parent-Teacher Meeting",  desc: "Discuss term-1 academic progress",              type: "PTM",       audience: "PARENTS",  location: "Each class room", color: "#fbbc04" },
    { d: 18,  title: "Pre-Board Exams begin (Class 10)", desc: "All students must reach by 8:30 AM",  type: "EXAM",      audience: "STUDENTS", classId: null, color: "#a142f4" },
    { d: -2,  title: "Buddha Purnima — Holiday",desc: "School closed",                                 type: "HOLIDAY",   audience: "ALL",      color: "#ea4335" },
    { d: 28,  title: "Independence Day Celebration", desc: "Flag hoisting at 8 AM, cultural program", type: "CULTURAL",  audience: "ALL",      location: "Auditorium", color: "#1a73e8" },
    { d: 45,  title: "Diwali Celebrations",     desc: "Diya decoration, rangoli competition",          type: "CULTURAL",  audience: "ALL",      color: "#e8710a" },
    { d: 60,  title: "Children's Day Picnic",   desc: "Day trip to Lalbagh Botanical Garden",          type: "EVENT",     audience: "STUDENTS", location: "Lalbagh", color: "#137333" },
    { d: -7,  title: "Gandhi Jayanti — Holiday",desc: "School closed",                                 type: "HOLIDAY",   audience: "ALL",      color: "#ea4335" },
  ];
  for (const e of events) {
    const dt = new Date(today.getTime() + e.d * 86400000);
    dt.setHours(9, 0, 0, 0);
    await db.schoolEvent.create({
      data: {
        schoolId: sId, title: e.title, description: e.desc, type: e.type, audience: e.audience,
        startsAt: dt, endsAt: new Date(dt.getTime() + 3600 * 1000),
        location: e.location ?? null, color: e.color,
      },
    });
  }

  console.log("\n✅ Extras seed complete.");
  console.log("   Timetable entries:", await db.timetableEntry.count());
  console.log("   Exams:", await db.exam.count(), "with marks:", await db.examMark.count());
  console.log("   Library books:", await db.book.count(), "open issues:", await db.bookIssue.count({ where: { returnedAt: null } }));
  console.log("   Events:", await db.schoolEvent.count());
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
