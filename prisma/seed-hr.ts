import "./_assert-not-prod";
// Supplementary seed — adds StaffAttendance, LeaveRequest, LeaveBalance, CompliancePeriod
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function ri(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

async function main() {
  await db.staffAttendance.deleteMany();
  await db.leaveRequest.deleteMany();
  await db.leaveBalance.deleteMany();
  await db.compliancePeriod.deleteMany();

  const school = await db.school.findFirst();
  if (!school) throw new Error("Run main seed first");

  const allStaff = await db.staff.findMany({ where: { schoolId: school.id }, include: { user: true } });
  const principal = allStaff.find((s) => s.designation === "Principal");
  const hr = allStaff.find((s) => s.designation === "HR Manager");
  const approver = principal ?? hr ?? allStaff[0];

  // 1) Staff attendance — last 30 calendar days
  console.log(`📅 Seeding staff attendance for ${allStaff.length} staff × 30 days...`);
  for (const st of allStaff) {
    for (let d = 0; d < 30; d++) {
      const day = new Date(); day.setDate(day.getDate() - d); day.setHours(0,0,0,0);
      const wd = day.getDay();
      let status = "PRESENT";
      let inTime: Date | null = new Date(day); inTime.setHours(8, ri(45, 59), 0, 0);
      let outTime: Date | null = new Date(day); outTime.setHours(16, ri(0, 30), 0, 0);
      let hours = 7.5;
      if (wd === 0) { status = "WEEKEND"; inTime = null; outTime = null; hours = 0; }
      else {
        const r = Math.random();
        if (r < 0.04) { status = "LEAVE"; inTime = null; outTime = null; hours = 0; }
        else if (r < 0.08) { status = "ABSENT"; inTime = null; outTime = null; hours = 0; }
        else if (r < 0.13) { status = "HALF_DAY"; outTime = new Date(day); outTime.setHours(12, 30, 0, 0); hours = 4; }
      }
      await db.staffAttendance.create({
        data: {
          staffId: st.id, date: day, status,
          inTime, outTime, hoursWorked: hours,
          source: rand(["BIOMETRIC","RFID","WEB_PUNCH","MANUAL"]),
        },
      });
    }
  }

  // 2) Leave balances for current year
  console.log("🏖️  Leave balances + sample leave requests...");
  const year = new Date().getFullYear();
  for (const st of allStaff) {
    for (const [type, granted] of [["CL", 12], ["SL", 12], ["EL", 18], ["COMP_OFF", 4]] as const) {
      await db.leaveBalance.create({ data: { staffId: st.id, year, type, granted, used: ri(0, Math.min(6, granted - 2)) } });
    }
  }

  // 3) Sample leave requests — pending + decided
  for (const st of allStaff.slice(0, 8)) {
    const days = ri(1, 3);
    const from = new Date(); from.setDate(from.getDate() + ri(-30, 30));
    const to = new Date(from); to.setDate(to.getDate() + days - 1);
    const r = Math.random();
    const statusPick = r < 0.5 ? "APPROVED" : r < 0.75 ? "PENDING" : "REJECTED";
    await db.leaveRequest.create({
      data: {
        staffId: st.id,
        type: rand(["CL","SL","EL","COMP_OFF"]),
        fromDate: from, toDate: to, days,
        reason: rand([
          "Family function",
          "Medical — fever and rest advised",
          "Personal travel",
          "Child's school event",
          "Bank work",
          "Festival leave",
        ]),
        status: statusPick,
        approverId: statusPick === "PENDING" ? null : approver.id,
        decidedAt: statusPick === "PENDING" ? null : new Date(),
        approverNote: statusPick === "REJECTED" ? "Coverage unavailable for the requested days." : null,
      },
    });
  }

  // 4) Compliance periods — last 6 months for PF, ESI, TDS, PT
  console.log("🧾 Compliance filings (PF/ESI/TDS/PT × 6 months)...");
  const today = new Date();
  for (const type of ["PF","ESI","TDS","PT"]) {
    for (let m = 0; m < 6; m++) {
      const d = new Date(today.getFullYear(), today.getMonth() - m, 1);
      const due = new Date(today.getFullYear(), today.getMonth() - m + 1, type === "TDS" ? 7 : 15);
      // Aggregate from payslips
      const slips = await db.payslip.findMany({ where: { schoolId: school.id, month: d.getMonth() + 1, year: d.getFullYear() } });
      let amount = 0;
      if (type === "PF")  amount = slips.reduce((s, p) => s + p.pf, 0);
      if (type === "ESI") amount = slips.reduce((s, p) => s + p.esi, 0);
      if (type === "TDS") amount = slips.reduce((s, p) => s + p.tds, 0);
      if (type === "PT")  amount = slips.length * 20000; // ₹200/month notional
      const status = m === 0 ? "PENDING" : "FILED";
      await db.compliancePeriod.create({
        data: {
          schoolId: school.id, type, month: d.getMonth() + 1, year: d.getFullYear(),
          amount, dueDate: due, status,
          filedAt: status === "FILED" ? new Date(due.getTime() - 86400000) : null,
          challanRef: status === "FILED" ? `${type}-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2,"0")}-${Math.floor(Math.random() * 999999)}` : null,
        },
      });
    }
  }

  console.log("✅ HR seed complete.");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
