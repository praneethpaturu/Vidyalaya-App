// Seeds MCB-extension demo data on top of an existing seeded school.
// Run AFTER `npm run db:seed` (and seed-hr / seed-tax if you use them).

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function main() {
  const school = await db.school.findFirst();
  if (!school) {
    console.error("✗ No school found — run `npm run db:seed` first.");
    process.exit(1);
  }
  const sId = school.id;
  console.log(`⏳ Seeding MCB extras for ${school.name}…`);

  // ─── Wipe what this script owns ───
  await db.connectCampaign.deleteMany({ where: { schoolId: sId } });
  await db.connectTemplate.deleteMany({ where: { schoolId: sId } });
  await db.connectProvider.deleteMany({ where: { schoolId: sId } });
  await db.enquiryInteraction.deleteMany({ where: { enquiry: { schoolId: sId } } });
  await db.admissionEnquiry.deleteMany({ where: { schoolId: sId } });
  await db.visitor.deleteMany({ where: { schoolId: sId } });
  await db.preRegisteredVisitor.deleteMany({ where: { schoolId: sId } });
  await db.visitPurpose.deleteMany({ where: { schoolId: sId } });
  await db.visitorBan.deleteMany({ where: { schoolId: sId } });
  await db.mealPlan.deleteMany({ where: { building: { schoolId: sId } } });
  await db.mealAttendance.deleteMany({ where: { schoolId: sId } });
  await db.outpass.deleteMany({ where: { schoolId: sId } });
  await db.hostelAllotment.deleteMany({ where: { schoolId: sId } });
  await db.hostelBed.deleteMany({ where: { building: { schoolId: sId } } });
  await db.hostelRoom.deleteMany({ where: { building: { schoolId: sId } } });
  await db.hostelFloor.deleteMany({ where: { building: { schoolId: sId } } });
  await db.hostelBuilding.deleteMany({ where: { schoolId: sId } });
  await db.concern.deleteMany({ where: { schoolId: sId } });
  await db.mentorMeeting.deleteMany({ where: { schoolId: sId } });
  await db.mentorMapping.deleteMany({ where: { schoolId: sId } });
  await db.placementApplication.deleteMany({ where: { opportunity: { schoolId: sId } } });
  await db.placementOpportunity.deleteMany({ where: { schoolId: sId } });
  await db.achievement.deleteMany({ where: { schoolId: sId } });
  await db.studentConcession.deleteMany({ where: { schoolId: sId } });
  await db.concessionType.deleteMany({ where: { schoolId: sId } });
  await db.scholarshipAward.deleteMany({ where: { scholarship: { schoolId: sId } } });
  await db.scholarship.deleteMany({ where: { schoolId: sId } });
  await db.libraryFineRule.deleteMany({ where: { schoolId: sId } });
  await db.libraryMaximumBooks.deleteMany({ where: { schoolId: sId } });
  await db.libraryReturnDays.deleteMany({ where: { schoolId: sId } });
  await db.libraryPublisher.deleteMany({ where: { schoolId: sId } });
  await db.libraryCategory.deleteMany({ where: { schoolId: sId } });
  await db.lexileBand.deleteMany({ where: { schoolId: sId } });
  await db.lexileGradeRange.deleteMany({ where: { schoolId: sId } });
  await db.libraryAssessment.deleteMany({ where: { schoolId: sId } });
  await db.onlineExamAttempt.deleteMany({ where: { exam: { schoolId: sId } } });
  await db.onlineQuestion.deleteMany({ where: { exam: { schoolId: sId } } });
  await db.onlineExam.deleteMany({ where: { schoolId: sId } });
  await db.expense.deleteMany({ where: { schoolId: sId } });
  await db.expenseHead.deleteMany({ where: { schoolId: sId } });
  await db.budgetLine.deleteMany({ where: { schoolId: sId } });
  await db.canteenTransaction.deleteMany({ where: { schoolId: sId } });
  await db.canteenWallet.deleteMany({ where: { schoolId: sId } });
  await db.canteenItem.deleteMany({ where: { schoolId: sId } });
  await db.storeSale.deleteMany({ where: { schoolId: sId } });
  await db.storeItem.deleteMany({ where: { schoolId: sId } });
  await db.dynamicFormSubmission.deleteMany({ where: { form: { schoolId: sId } } });
  await db.dynamicForm.deleteMany({ where: { schoolId: sId } });
  await db.loginEvent.deleteMany({ where: { schoolId: sId } });
  await db.diaryEntry.deleteMany({ where: { schoolId: sId } });
  await db.photo.deleteMany({ where: { album: { schoolId: sId } } });
  await db.photoAlbum.deleteMany({ where: { schoolId: sId } });
  await db.wallComment.deleteMany({ where: { post: { schoolId: sId } } });
  await db.wallPost.deleteMany({ where: { schoolId: sId } });
  await db.teachingPlan.deleteMany({ where: { schoolId: sId } });
  await db.onlineClass.deleteMany({ where: { schoolId: sId } });
  await db.contentItem.deleteMany({ where: { schoolId: sId } });
  await db.nEPHPCEntry.deleteMany({ where: { schoolId: sId } });
  await db.classObservation.deleteMany({ where: { schoolId: sId } });
  await db.subjectMaster.deleteMany({ where: { schoolId: sId } });
  await db.learningTaxonomy.deleteMany({ where: { schoolId: sId } });
  await db.reflection.deleteMany({ where: { schoolId: sId } });
  await db.baselineAssessment.deleteMany({ where: { schoolId: sId } });
  await db.approvalRequest.deleteMany({ where: { schoolId: sId } });
  await db.vehicleDoc.deleteMany({ where: { schoolId: sId } });
  await db.staffDoc.deleteMany({ where: { schoolId: sId } });
  await db.certificateIssue.deleteMany({ where: { schoolId: sId } });
  await db.certificateTemplate.deleteMany({ where: { schoolId: sId } });

  // ─── 1. Connect providers + templates ───
  await db.connectProvider.createMany({
    data: [
      { schoolId: sId, channel: "SMS", name: "MSG91", senderId: "LAKSHY", dltEntityId: "1701234567890123456", credits: 12500 },
      { schoolId: sId, channel: "WHATSAPP", name: "Gupshup (Meta)", senderId: "Lakshya School", credits: 4800 },
      { schoolId: sId, channel: "EMAIL", name: "AWS SES", senderId: "noreply@lakshya.school", credits: 100000 },
      { schoolId: sId, channel: "VOICE", name: "Twilio", senderId: "+91-80-XXXXX", credits: 800 },
    ],
  });
  await db.connectTemplate.createMany({
    data: [
      { schoolId: sId, channel: "SMS", name: "Fee paid", body: "Dear {{parentName}}, payment of ₹{{amount}} for {{studentName}} ({{class}}) received. Thank you. - {{school}}", approved: true, category: "TRANSACTIONAL" },
      { schoolId: sId, channel: "SMS", name: "Absent alert", body: "Dear {{parentName}}, {{studentName}} was marked absent today ({{date}}). - {{school}}", approved: true, category: "TRANSACTIONAL" },
      { schoolId: sId, channel: "SMS", name: "PTM reminder", body: "Reminder: PTM scheduled for {{date}}, {{time}} at {{venue}}. - {{school}}", approved: false, category: "TRANSACTIONAL" },
      { schoolId: sId, channel: "WHATSAPP", name: "Bus boarded", body: "🚌 {{studentName}} boarded {{busNumber}} at {{stop}} ({{time}}).", approved: true, category: "TRANSACTIONAL" },
      { schoolId: sId, channel: "WHATSAPP", name: "Result published", body: "📊 {{examName}} results for {{studentName}} are now available. Open the parent app.", approved: true, category: "TRANSACTIONAL" },
      { schoolId: sId, channel: "EMAIL", name: "Welcome", body: "Welcome to {{school}}!\n\n{{studentName}} has been admitted to {{class}}. Your login credentials follow.\n\n- {{school}}", approved: true },
    ],
  });
  await db.connectCampaign.createMany({
    data: [
      { schoolId: sId, channel: "SMS", name: "Term-1 Fee Reminder", body: "Pay your Term-1 fees before {{dueDate}} to avoid late fee.", audienceFilter: "{}", status: "SENT", recipients: 320, delivered: 314, failed: 6, sentAt: new Date(Date.now() - 5 * 86400000) },
      { schoolId: sId, channel: "WHATSAPP", name: "Sports Day '26 invite", body: "🏆 Sports Day 2026-27 — see you on the ground!", audienceFilter: "{}", status: "SENT", recipients: 850, delivered: 832, failed: 18, sentAt: new Date(Date.now() - 12 * 86400000) },
    ],
  });

  // ─── 2. Admissions enquiries ───
  const SRC = ["WEB", "WALK_IN", "QR", "REFERRAL", "CAMPAIGN", "NEWSPAPER", "EVENT"];
  const STAGES = ["ENQUIRY", "APPLICATION", "INTERACTION", "TOUR", "APPLICATION_SUBMITTED", "DOCUMENT_SUBMITTED", "PRE_ADMISSION_TEST", "OFFER", "CONFIRMED", "ENROLLED", "LOST"];
  const GRADES = ["EY", "EY1", "EY2", "Grade I", "Grade II", "Grade III", "Grade IV", "Grade V", "Grade VI", "Grade VII", "Grade VIII", "Grade IX"];
  const CHILD_NAMES_M = ["Arnav", "Vihaan", "Aarav", "Reyansh", "Vivaan", "Atharv", "Krishiv", "Yashvi", "Veer", "Ayaan"];
  const CHILD_NAMES_F = ["Aanya", "Diya", "Anvi", "Anika", "Pari", "Saanvi", "Kiara", "Mira", "Ira", "Tanvi"];
  const PARENTS = ["Rajesh", "Anil", "Suresh", "Naveen", "Manoj", "Pradeep", "Vinod", "Sandeep"];
  const SUR = ["Sharma", "Iyer", "Patel", "Verma", "Reddy", "Mehta", "Singh", "Kumar"];
  for (let i = 0; i < 60; i++) {
    const isMale = Math.random() > 0.5;
    const childName = `${rand(isMale ? CHILD_NAMES_M : CHILD_NAMES_F)} ${rand(SUR)}`;
    const parentName = `${rand(PARENTS)} ${rand(SUR)}`;
    // Funnel weights — most stay early, fewer enrolled
    const stageIdx = Math.random() < 0.35 ? 0
                  : Math.random() < 0.55 ? 1
                  : Math.random() < 0.65 ? 3
                  : Math.random() < 0.78 ? 5
                  : Math.random() < 0.86 ? 7
                  : Math.random() < 0.92 ? 9
                  : 10;
    const status = STAGES[stageIdx];
    const createdAt = new Date(Date.now() - randInt(1, 120) * 86400000);
    const enq = await db.admissionEnquiry.create({
      data: {
        schoolId: sId,
        childName,
        childGender: isMale ? "Male" : "Female",
        expectedGrade: rand(GRADES),
        parentName,
        parentPhone: `+91 9${randInt(100000000, 999999999)}`,
        parentEmail: `${parentName.split(" ")[0].toLowerCase()}.${parentName.split(" ")[1].toLowerCase()}@gmail.com`,
        source: rand(SRC) as string,
        subSource: Math.random() > 0.7 ? rand(["Google Ads", "Facebook", "Instagram", "Hoarding"]) : null,
        campaign: Math.random() > 0.7 ? rand(["Summer 2026", "EY Open Day", "Class IX Push"]) : null,
        preferredBranch: "Main",
        status,
        applicationFee: Math.random() < 0.4 ? 50000 : 0,
        feePaid: Math.random() < 0.3,
        notes: i % 5 === 0 ? "Sibling already enrolled." : null,
        followUpAt: stageIdx < 4 ? new Date(Date.now() + randInt(1, 14) * 86400000) : null,
        createdAt,
      },
    });
    if (Math.random() > 0.5) {
      await db.enquiryInteraction.create({
        data: {
          enquiryId: enq.id,
          type: rand(["CALL", "EMAIL", "VISIT", "NOTE"]) as string,
          summary: rand(["Called, parent not available.", "Sent brochure via WhatsApp.", "Tour scheduled for next week.", "Follow-up planned."]) as string,
        },
      });
    }
  }

  // ─── 3. Visitor purposes + sample visits ───
  const purposes = await db.visitPurpose.createManyAndReturn({
    data: [
      { schoolId: sId, name: "Parent Visit" },
      { schoolId: sId, name: "Vendor Delivery" },
      { schoolId: sId, name: "Maintenance" },
      { schoolId: sId, name: "Interview", needsOtp: true },
      { schoolId: sId, name: "Tour / Admission Enquiry" },
      { schoolId: sId, name: "Govt. Inspection", needsOtp: true },
    ],
  });
  await db.visitorBan.create({
    data: { schoolId: sId, name: "John Doe (banned)", phone: "+91 9000000000", reason: "Repeated misconduct" },
  });
  for (let i = 0; i < 12; i++) {
    const inAt = new Date(Date.now() - randInt(0, 7) * 86400000 - randInt(0, 8 * 3600000));
    const isOut = Math.random() > 0.3;
    await db.visitor.create({
      data: {
        schoolId: sId,
        name: `${rand(PARENTS)} ${rand(SUR)}`,
        phone: `+91 9${randInt(100000000, 999999999)}`,
        purpose: rand(purposes).name,
        hostName: rand(["Principal", "Class teacher", "Accountant", "HR"]) as string,
        vehicleNo: Math.random() > 0.5 ? `KA-01-${rand(["AB", "CD", "EF", "GH"])}-${randInt(1000, 9999)}` : null,
        idProofType: "AADHAAR",
        idProofNo: `XXXX-XXXX-${randInt(1000, 9999)}`,
        badgeNo: "V" + String(Date.now() - i * 1000).slice(-7),
        inAt,
        outAt: isOut ? new Date(inAt.getTime() + randInt(15, 120) * 60000) : null,
        status: isOut ? "OUT" : "IN",
      },
    });
  }

  // ─── 4. Hostel: 2 buildings, 2 floors each, 5 rooms each, 4 beds each ───
  for (const g of [{ name: "Boys Hostel A", gender: "BOYS" }, { name: "Girls Hostel B", gender: "GIRLS" }]) {
    const b = await db.hostelBuilding.create({
      data: { schoolId: sId, name: g.name, gender: g.gender },
    });
    for (let f = 0; f <= 1; f++) {
      const floor = await db.hostelFloor.create({
        data: { buildingId: b.id, number: f, name: f === 0 ? "Ground" : `${f}st`.replace("1st", "1st") },
      });
      for (let r = 0; r < 5; r++) {
        const room = await db.hostelRoom.create({
          data: {
            buildingId: b.id, floorId: floor.id,
            number: `${f === 0 ? "G" : f}0${r + 1}`,
            type: r === 4 ? "DORM" : (r % 2 === 0 ? "AC" : "STANDARD"),
            capacity: r === 4 ? 6 : 2,
          },
        });
        const beds = r === 4 ? ["A", "B", "C", "D", "E", "F"] : ["A", "B"];
        for (const lbl of beds) {
          await db.hostelBed.create({
            data: { buildingId: b.id, roomId: room.id, label: lbl, status: Math.random() < 0.55 ? "OCCUPIED" : "VACANT" },
          });
        }
      }
    }
  }
  // Allot ~40% of students to occupied beds
  const buildings = await db.hostelBuilding.findMany({ where: { schoolId: sId }, include: { beds: true } });
  const occupiedBeds = buildings.flatMap((b) => b.beds.filter((bd) => bd.status === "OCCUPIED").map((bd) => ({ ...bd, gender: b.gender })));
  const allStudents = await db.student.findMany({ where: { schoolId: sId } });
  const malePool = allStudents.filter((s) => /male|m/i.test(s.gender) && !/female/i.test(s.gender));
  const femalePool = allStudents.filter((s) => /female|f/i.test(s.gender));
  for (const bed of occupiedBeds) {
    const pool = bed.gender === "BOYS" ? malePool : femalePool;
    if (pool.length === 0) continue;
    const stu = pool.shift();
    if (!stu) continue;
    await db.hostelAllotment.create({
      data: {
        schoolId: sId, studentId: stu.id, buildingId: bed.buildingId, bedId: bed.id,
        fromDate: new Date(Date.now() - randInt(30, 200) * 86400000),
        monthlyRent: 8000_00, securityDeposit: 25000_00,
      },
    });
  }
  // Meal plans for both buildings — same menu
  const DAYS = [0, 1, 2, 3, 4, 5, 6];
  const MEALS: { meal: string; menus: string[] }[] = [
    { meal: "BREAKFAST", menus: ["Idli, Sambar, Chutney", "Poha, Banana", "Aloo paratha, Curd", "Upma, Coconut chutney", "Bread Toast, Eggs", "Dosa, Sambar", "Puri, Aloo subzi"] },
    { meal: "LUNCH", menus: ["Rice, Dal, Sabzi, Curd", "Roti, Paneer, Dal, Salad", "Veg biryani, Raita", "Sambar rice, Vegetable", "Rajma chawal", "Pulao, Dal, Salad", "Special thali"] },
    { meal: "SNACKS", menus: ["Tea, Biscuits", "Bhel, Lemon water", "Sandwich, Juice", "Vada Pav", "Samosa, Tea", "Pakoda, Tea", "Fruit chaat"] },
    { meal: "DINNER", menus: ["Roti, Sabzi, Dal", "Rice, Chicken curry (non-veg) / Veg curry", "Khichdi, Papad, Pickle", "Pasta, Soup", "Pulao, Raita", "Roti, Paneer, Dal", "Special weekend dinner"] },
  ];
  for (const b of buildings) {
    for (const day of DAYS) {
      for (const m of MEALS) {
        await db.mealPlan.create({ data: { buildingId: b.id, dayOfWeek: day, meal: m.meal, menu: m.menus[day] } });
      }
    }
  }

  // ─── 5. Concerns ───
  const CAT = ["ACADEMIC", "DISCIPLINE", "HEALTH", "IT", "INFRA", "TRANSPORT", "HOSTEL", "OTHER"];
  const SEV = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
  for (let i = 0; i < 14; i++) {
    const isOld = i < 6;
    const status = isOld ? rand(["RESOLVED", "CLOSED"]) : rand(["OPEN", "IN_PROGRESS"]);
    await db.concern.create({
      data: {
        schoolId: sId,
        raisedByName: i % 5 === 0 ? "Anonymous" : `${rand(PARENTS)} ${rand(SUR)}`,
        anonymous: i % 5 === 0,
        category: rand(CAT) as string,
        severity: rand(SEV) as string,
        subject: rand([
          "Bus running consistently late on Route 3",
          "Mathematics test difficult and not on syllabus",
          "Hostel mess food quality declining",
          "Wifi unavailable in Block C",
          "Locker damaged and not replaced",
          "Coach absent during practice for 3 days",
        ]) as string,
        body: "Detailed description of the concern goes here. Please escalate.",
        status: status as string,
        slaDueAt: new Date(Date.now() + randInt(1, 14) * 86400000),
        resolvedAt: status === "RESOLVED" || status === "CLOSED" ? new Date(Date.now() - randInt(1, 30) * 86400000) : null,
        createdAt: new Date(Date.now() - randInt(0, 60) * 86400000),
      },
    });
  }

  // ─── 6. Mentor mappings ───
  const teachers = await db.staff.findMany({ where: { schoolId: sId, designation: { contains: "Teacher" } }, take: 8 });
  const studentSlice = allStudents.slice(0, 40);
  for (let i = 0; i < studentSlice.length; i++) {
    const mentor = teachers[i % teachers.length];
    if (!mentor) continue;
    await db.mentorMapping.create({
      data: { schoolId: sId, mentorId: mentor.id, studentId: studentSlice[i].id, fromDate: new Date(Date.now() - 60 * 86400000) },
    });
    if (i % 4 === 0) {
      await db.mentorMeeting.create({
        data: {
          schoolId: sId, mentorId: mentor.id, studentId: studentSlice[i].id,
          meetingAt: new Date(Date.now() - randInt(7, 30) * 86400000),
          agenda: rand(["Term review", "Goal setting", "Behavior discussion", "Career guidance"]) as string,
          notes: "Productive session. Student shared concerns and goals.",
          actionItems: "Practice 30 min Math daily; revisit chapter 4 by next week.",
          followUpAt: new Date(Date.now() + 14 * 86400000),
        },
      });
    }
  }

  // ─── 7. Achievements ───
  const ACH = [
    { category: "SPORTS", title: "Inter-school Cricket — Runner-up", level: "DISTRICT" },
    { category: "ACADEMIC", title: "Mathematics Olympiad — Gold", level: "STATE" },
    { category: "CULTURAL", title: "Annual Day — Best Choreography", level: "SCHOOL" },
    { category: "ACADEMIC", title: "Science Quiz — 1st place", level: "SCHOOL" },
    { category: "SPORTS", title: "Chess Tournament — Bronze", level: "STATE" },
    { category: "CULTURAL", title: "Kannada Elocution — 1st", level: "DISTRICT" },
  ];
  for (const a of ACH) {
    const stu = rand(allStudents);
    await db.achievement.create({
      data: {
        schoolId: sId, ...a, studentId: stu.id,
        position: a.title.includes("Gold") ? "1st" : a.title.includes("Bronze") ? "3rd" : "2nd",
        awardedAt: new Date(Date.now() - randInt(7, 180) * 86400000),
      },
    });
  }

  // ─── 8. Concession types ───
  await db.concessionType.createMany({
    data: [
      { schoolId: sId, name: "SIBLING", description: "Sibling discount", defaultPct: 10 },
      { schoolId: sId, name: "STAFF_WARD", description: "Staff ward discount", defaultPct: 50 },
      { schoolId: sId, name: "MERIT", description: "Academic merit", defaultPct: 25 },
      { schoolId: sId, name: "SPORTS", description: "Sports excellence", defaultPct: 20 },
      { schoolId: sId, name: "NEED_BASED", description: "Financial need", defaultPct: 30 },
    ],
  });
  // Random scholarships
  const sch = await db.scholarship.create({
    data: {
      schoolId: sId, name: "Lakshya Merit Scholarship",
      description: "Top 5% academic scholars receive 50% fee waiver.",
      amount: 50000_00, eligibility: "Top 5% in pre-board exams.",
    },
  });
  for (const s of allStudents.slice(0, 4)) {
    await db.scholarshipAward.create({
      data: { scholarshipId: sch.id, studentId: s.id, amount: 50000_00, status: "DISBURSED" },
    });
  }

  // ─── 9. Library masters ───
  await db.libraryCategory.createMany({
    data: [
      { schoolId: sId, name: "Reference" },
      { schoolId: sId, name: "Textbook" },
      { schoolId: sId, name: "Fiction" },
      { schoolId: sId, name: "Non-Fiction" },
      { schoolId: sId, name: "Periodical" },
    ],
  });
  await db.libraryPublisher.createMany({
    data: [
      { schoolId: sId, name: "NCERT" },
      { schoolId: sId, name: "Penguin India" },
      { schoolId: sId, name: "Cambridge University Press" },
      { schoolId: sId, name: "Pearson" },
      { schoolId: sId, name: "Oxford University Press" },
    ],
  });
  await db.libraryReturnDays.createMany({
    data: [
      { schoolId: sId, memberType: "STUDENT", category: "Fiction", days: 14, graceDays: 2, excludeWeekends: true },
      { schoolId: sId, memberType: "STUDENT", category: "Reference", days: 3, graceDays: 0 },
      { schoolId: sId, memberType: "STUDENT", category: "Textbook", days: 90, graceDays: 7 },
      { schoolId: sId, memberType: "STAFF", category: "Reference", days: 14 },
      { schoolId: sId, memberType: "STAFF", category: "Fiction", days: 30 },
    ],
  });
  await db.libraryMaximumBooks.createMany({
    data: [
      { schoolId: sId, memberType: "STUDENT", category: "Fiction", maxBooks: 2 },
      { schoolId: sId, memberType: "STUDENT", category: "Reference", maxBooks: 1 },
      { schoolId: sId, memberType: "STAFF", category: "Fiction", maxBooks: 5 },
      { schoolId: sId, memberType: "STAFF", category: "Reference", maxBooks: 3 },
    ],
  });
  await db.libraryFineRule.createMany({
    data: [
      { schoolId: sId, category: "Fiction", daysFrom: 1, daysTo: 7, amountPerDay: 200, capAmount: 5000 },
      { schoolId: sId, category: "Fiction", daysFrom: 8, daysTo: -1, amountPerDay: 500, capAmount: 50000 },
      { schoolId: sId, category: "Reference", daysFrom: 1, daysTo: -1, amountPerDay: 1000, capAmount: 50000 },
      { schoolId: sId, category: "Textbook", daysFrom: 1, daysTo: 30, amountPerDay: 100, capAmount: 10000 },
    ],
  });
  await db.lexileBand.createMany({
    data: [
      { schoolId: sId, label: "Below Grade", minLexile: 0, maxLexile: 600 },
      { schoolId: sId, label: "On Grade", minLexile: 600, maxLexile: 1100 },
      { schoolId: sId, label: "Above Grade", minLexile: 1100, maxLexile: 2000 },
    ],
  });
  const classes = await db.class.findMany({ where: { schoolId: sId } });
  for (const c of classes.slice(0, 5)) {
    const grade = parseInt(c.grade.replace(/[^0-9]/g, "")) || 6;
    await db.lexileGradeRange.create({
      data: { schoolId: sId, classId: c.id, minLexile: 200 + grade * 60, maxLexile: 400 + grade * 80 },
    });
  }

  // ─── 10. Online exams ───
  if (classes.length > 0) {
    const cl = classes[0];
    const e = await db.onlineExam.create({
      data: {
        schoolId: sId, classId: cl.id, title: "Mathematics Unit Test 1",
        flavor: "OBJECTIVE",
        startAt: new Date(Date.now() + 3 * 86400000),
        endAt: new Date(Date.now() + 3 * 86400000 + 60 * 60000),
        durationMin: 60, totalMarks: 30, passMarks: 12, attempts: 1, shuffle: true, status: "PUBLISHED",
      },
    });
    await db.onlineQuestion.createMany({
      data: [
        { examId: e.id, text: "What is 7 × 8?", type: "MCQ", options: JSON.stringify(["54", "56", "58", "60"]), correct: JSON.stringify([1]), marks: 2, order: 1 },
        { examId: e.id, text: "True or False — π is rational.", type: "TF", options: JSON.stringify([]), correct: JSON.stringify("false"), marks: 2, order: 2 },
        { examId: e.id, text: "The square root of 144 is ___.", type: "FILL", options: JSON.stringify([]), correct: JSON.stringify("12"), marks: 2, order: 3 },
        { examId: e.id, text: "Select all primes:", type: "MULTI", options: JSON.stringify(["2", "4", "5", "9", "11"]), correct: JSON.stringify([0, 2, 4]), marks: 4, order: 4 },
      ],
    });
  }

  // ─── 11. Expense heads + sample expenses ───
  await db.expenseHead.createMany({
    data: [
      { schoolId: sId, name: "Salaries" },
      { schoolId: sId, name: "Utilities" },
      { schoolId: sId, name: "Repairs & Maintenance" },
      { schoolId: sId, name: "Stationery" },
      { schoolId: sId, name: "Travel" },
      { schoolId: sId, name: "Marketing" },
    ],
  });
  for (let i = 0; i < 12; i++) {
    await db.expense.create({
      data: {
        schoolId: sId, voucherNo: `EXP-${new Date().getFullYear()}-${String(i + 1).padStart(4, "0")}`,
        headName: rand(["Salaries", "Utilities", "Repairs & Maintenance", "Stationery", "Travel", "Marketing"]) as string,
        amount: randInt(5000, 200000) * 100,
        description: rand(["Monthly electricity", "Printer cartridges", "Bus diesel refill", "Cleaning supplies", "Workshop", "Outdoor banners"]) as string,
        expenseDate: new Date(Date.now() - randInt(0, 60) * 86400000),
        status: rand(["PAID", "APPROVED", "SUBMITTED", "DRAFT"]) as string,
        paymentMethod: rand(["NEFT", "UPI", "CASH"]) as string,
      },
    });
  }
  await db.budgetLine.createMany({
    data: [
      // Amounts in paise — capped under SQLite Int max (~2.14e9) for the demo.
      { schoolId: sId, fy: "2026-27", costCenter: "Admin", headName: "Salaries", plannedAmount: 18_00_00_000 },
      { schoolId: sId, fy: "2026-27", costCenter: "Operations", headName: "Utilities", plannedAmount: 60_00_000 },
      { schoolId: sId, fy: "2026-27", costCenter: "Operations", headName: "Repairs & Maintenance", plannedAmount: 40_00_000 },
      { schoolId: sId, fy: "2026-27", costCenter: "Academics", headName: "Stationery", plannedAmount: 15_00_000 },
      { schoolId: sId, fy: "2026-27", costCenter: "Operations", headName: "Travel", plannedAmount: 25_00_000 },
      { schoolId: sId, fy: "2026-27", costCenter: "Marketing", headName: "Marketing", plannedAmount: 50_00_000 },
    ],
  });

  // ─── 12. Canteen ───
  await db.canteenItem.createMany({
    data: [
      { schoolId: sId, name: "Veg Sandwich", category: "MAINS", price: 4000, isVeg: true },
      { schoolId: sId, name: "Masala Dosa", category: "MAINS", price: 6000, isVeg: true },
      { schoolId: sId, name: "Cheese Pizza Slice", category: "SNACKS", price: 5000, isVeg: true },
      { schoolId: sId, name: "Chicken Roll", category: "MAINS", price: 8000, isVeg: false },
      { schoolId: sId, name: "Fresh Lime Soda", category: "DRINKS", price: 3000, isVeg: true },
      { schoolId: sId, name: "Cold Coffee", category: "DRINKS", price: 5000, isVeg: true },
      { schoolId: sId, name: "Gulab Jamun (2 pc)", category: "DESSERTS", price: 4000, isVeg: true },
    ],
  });
  // Some wallet activity
  for (const s of allStudents.slice(0, 8)) {
    const w = await db.canteenWallet.create({ data: { schoolId: sId, studentId: s.id, balance: 50000 } });
    let bal = 50000;
    for (let t = 0; t < 5; t++) {
      const amt = randInt(3000, 8000);
      bal -= amt;
      await db.canteenTransaction.create({
        data: { schoolId: sId, walletId: w.id, type: "CHARGE", amount: amt, balance: bal, createdAt: new Date(Date.now() - t * 86400000) },
      });
    }
    await db.canteenWallet.update({ where: { id: w.id }, data: { balance: bal } });
  }

  // ─── 13. School Store ───
  await db.storeItem.createMany({
    data: [
      { schoolId: sId, sku: "UNI-SHIRT-S", name: "School Shirt (Small)", category: "UNIFORM", price: 65000, qtyOnHand: 80 },
      { schoolId: sId, sku: "UNI-SHIRT-M", name: "School Shirt (Medium)", category: "UNIFORM", price: 65000, qtyOnHand: 65 },
      { schoolId: sId, sku: "UNI-SHIRT-L", name: "School Shirt (Large)", category: "UNIFORM", price: 70000, qtyOnHand: 40 },
      { schoolId: sId, sku: "UNI-PANT-M", name: "Trousers (Medium)", category: "UNIFORM", price: 80000, qtyOnHand: 50 },
      { schoolId: sId, sku: "BK-MATH-6", name: "Mathematics Class 6", category: "BOOK", price: 35000, qtyOnHand: 20 },
      { schoolId: sId, sku: "BK-SCI-6", name: "Science Class 6", category: "BOOK", price: 35000, qtyOnHand: 18 },
      { schoolId: sId, sku: "ST-NB-1", name: "Notebook 200pg", category: "STATIONERY", price: 8000, qtyOnHand: 200 },
      { schoolId: sId, sku: "ST-PEN-1", name: "Blue ballpoint pen", category: "STATIONERY", price: 1000, qtyOnHand: 500 },
    ],
  });

  // ─── 14. Login events ───
  const users = await db.user.findMany({ where: { schoolId: sId }, take: 60 });
  for (const u of users) {
    if (Math.random() < 0.15) continue; // ~15% never logged in
    for (let i = 0; i < randInt(1, 6); i++) {
      await db.loginEvent.create({
        data: {
          schoolId: sId,
          userId: u.id,
          email: u.email,
          success: Math.random() > 0.05,
          ip: `192.168.${randInt(1, 254)}.${randInt(2, 254)}`,
          userAgent: rand(["Chrome 138", "Edge 138", "Safari 18", "Firefox 130"]) as string,
          device: rand(["WEB", "ANDROID", "IOS"]) as string,
          loggedAt: new Date(Date.now() - randInt(0, 7) * 86400000 - randInt(0, 24) * 3600000),
        },
      });
    }
  }

  // ─── 15. Vehicle docs (expiry tracking) ───
  const buses = await db.bus.findMany({ where: { schoolId: sId } });
  const DOC_TYPES = ["FITNESS", "PUC", "INSURANCE", "PERMIT"];
  for (const b of buses) {
    for (const t of DOC_TYPES) {
      const validTo = new Date(Date.now() + randInt(-30, 365) * 86400000);
      await db.vehicleDoc.create({
        data: {
          schoolId: sId, busId: b.id, type: t,
          number: `${t}-${b.number.replace(/[^A-Z0-9]/g, "")}-${randInt(1000, 9999)}`,
          validFrom: new Date(validTo.getTime() - 365 * 86400000),
          validTo,
        },
      });
    }
  }

  // ─── 16. Reflections + Diary entries ───
  const teacherUsers = await db.user.findMany({ where: { schoolId: sId, role: "TEACHER" }, take: 5 });
  for (let i = 0; i < 6; i++) {
    const u = rand(teacherUsers);
    if (!u) break;
    await db.reflection.create({
      data: {
        schoolId: sId,
        authorId: u.id,
        authorRole: "TEACHER",
        title: rand(["Today's class", "Insight", "Student needs help"]) as string,
        body: rand([
          "Class was attentive today; the activity-based approach helped.",
          "Need to revise pacing — chapter 4 needs an extra session.",
          "Three students need additional help with fractions.",
        ]) as string,
        mood: rand(["HAPPY", "OK", "TIRED"]) as string,
      },
    });
  }
  for (const c of classes.slice(0, 4)) {
    await db.diaryEntry.create({
      data: {
        schoolId: sId, classId: c.id,
        title: "Today's lesson",
        body: "Covered chapter 3 — exercises 3.1 to 3.5. Class participation was good.",
        homework: "Solve exercises 3.6 and 3.7 from the textbook.",
        postedAt: new Date(Date.now() - randInt(0, 3) * 86400000),
      },
    });
  }

  // ─── 17. Wall posts ───
  await db.wallPost.createMany({
    data: [
      { schoolId: sId, authorId: users[0].id, authorName: users[0].name, audience: "STAFF", body: "Welcome back! AY 2026-27 timetable is now live.", pinned: true },
      { schoolId: sId, authorId: users[1].id, authorName: users[1].name, audience: "STAFF", body: "Reminder: Submit Q1 lesson plans by Friday." },
      { schoolId: sId, authorId: users[2].id, authorName: users[2].name, audience: "ALL", body: "Sports Day '26 is on August 22 — registration open." },
    ],
  });

  // ─── 18. Approvals ───
  await db.approvalRequest.createMany({
    data: [
      { schoolId: sId, kind: "FEE_WAIVER", summary: "Fee waiver of ₹5,000 for student Aarav Sharma — financial hardship." },
      { schoolId: sId, kind: "TC", summary: "TC requested by Priya Iyer — pending hostel clearance (1 active allotment)." },
      { schoolId: sId, kind: "ADMISSION", summary: "Mid-year admission to Grade VII." },
      { schoolId: sId, kind: "EXPENSE", summary: "Expense voucher EXP-2026-0011 — ₹85,000 for printer maintenance contract." },
    ],
  });

  // ─── 19. Certificate templates ───
  await db.certificateTemplate.createMany({
    data: [
      { schoolId: sId, type: "TC", name: "Standard CBSE TC", body: "TRANSFER CERTIFICATE\n\nThis is to certify that {{student.name}}, son/daughter of {{parent.name}}, was a bona fide student of this school from {{joinedAt}} to {{leftAt}}, studying in class {{class}}.", signatory: "Principal" },
      { schoolId: sId, type: "BONAFIDE", name: "Standard Bonafide", body: "BONAFIDE CERTIFICATE\n\nThis is to certify that {{student.name}} is a bona fide student of {{school.name}} for the academic year {{academicYear}} in class {{class}}, with admission number {{student.admissionNo}}.", signatory: "Principal" },
      { schoolId: sId, type: "CHARACTER", name: "Character Certificate", body: "CHARACTER CERTIFICATE\n\n{{student.name}} bore a good moral character during their period of study at this institution.", signatory: "Principal" },
    ],
  });

  // ─── 20. NEP HPC entries ───
  const DOMAINS = ["PHYSICAL", "SOCIO_EMOTIONAL", "COGNITIVE", "LANGUAGE", "LIFE_SKILLS"];
  const SOURCES = ["TEACHER", "PARENT", "PEER", "SELF"];
  for (let i = 0; i < 24; i++) {
    const stu = rand(allStudents);
    await db.nEPHPCEntry.create({
      data: {
        schoolId: sId, studentId: stu.id,
        term: rand(["T1", "T2", "T3"]) as string,
        year: 2026,
        domain: rand(DOMAINS) as string,
        source: rand(SOURCES) as string,
        descriptor: rand([
          "Demonstrates strong listening skills and group work.",
          "Shows curiosity in science experiments.",
          "Needs practice in time management for assignments.",
          "Displays empathy with peers in conflict resolution.",
          "Reading comprehension on grade level.",
        ]) as string,
        rubricLevel: rand(["STREAM", "PROFICIENT", "DEVELOPING", "EMERGING"]) as string,
      },
    });
  }

  // ─── 21. Subject masters + taxonomy ───
  await db.subjectMaster.createMany({
    data: [
      { schoolId: sId, name: "Mathematics", code: "MTH", creditHours: 5, hasTheory: true, hasPractical: false },
      { schoolId: sId, name: "Science", code: "SCI", creditHours: 5, hasTheory: true, hasPractical: true },
      { schoolId: sId, name: "Social Studies", code: "SST", creditHours: 4 },
      { schoolId: sId, name: "English", code: "ENG", creditHours: 5 },
      { schoolId: sId, name: "Hindi", code: "HIN", creditHours: 4 },
      { schoolId: sId, name: "Computer Science", code: "CSC", creditHours: 3, hasTheory: true, hasPractical: true },
    ],
  });
  await db.learningTaxonomy.createMany({
    data: [
      { schoolId: sId, name: "Bloom", levelsCsv: "Remember,Understand,Apply,Analyse,Evaluate,Create" },
      { schoolId: sId, name: "SOLO", levelsCsv: "Pre-structural,Uni-structural,Multi-structural,Relational,Extended Abstract" },
    ],
  });

  // ─── 22. Photo album ───
  const album = await db.photoAlbum.create({
    data: { schoolId: sId, title: "Annual Day 2026", description: "Highlights from the cultural performance.", audience: "ALL", watermark: true, downloadAllowed: false },
  });
  await db.photo.createMany({
    data: [1, 2, 3, 4].map((i) => ({ albumId: album.id, url: `https://picsum.photos/seed/anniv${i}/600/400`, caption: `Annual Day ${i}` })),
  });

  // ─── 23. Online classes ───
  for (const c of classes.slice(0, 3)) {
    await db.onlineClass.create({
      data: {
        schoolId: sId, classId: c.id, title: "Doubt clearing — Mathematics",
        provider: "MEET", joinUrl: "https://meet.google.com/abc-defg-hij",
        scheduledAt: new Date(Date.now() + 2 * 86400000), durationMin: 45,
      },
    });
  }
  console.log("✅ MCB seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
