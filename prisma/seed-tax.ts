// Supplementary seed — Org tax profile, TDS challans, vendor TDS deductions,
// compliance calendar, and Form 16 generation for the previous FY.

import { PrismaClient } from "@prisma/client";
import { calculateVendorTds } from "../lib/vendor-tds";
import { fyOf, dueDateFor, quarterOf, form16For } from "../lib/compliance";

const db = new PrismaClient();

function rand<T>(arr: T[]) { return arr[Math.floor(Math.random() * arr.length)]; }
function ri(a: number, b: number) { return Math.floor(Math.random() * (b - a + 1)) + a; }

async function main() {
  console.log("⏳ Wiping tax-side data...");
  await db.form16Issuance.deleteMany();
  await db.vendorTdsDeduction.deleteMany();
  await db.tdsChallan.deleteMany();
  await db.compliancePeriod.deleteMany(); // refresh calendar from scratch
  await db.orgTaxProfile.deleteMany();

  const school = await db.school.findFirst();
  if (!school) throw new Error("Run main seed first");

  console.log("🏛️ Org tax profile (Trust, 12A registered)...");
  await db.orgTaxProfile.create({
    data: {
      schoolId: school.id,
      legalName: "Lakshya School of Excellence Educational Trust",
      pan: "AAATD7894K",
      tan: "BLRD12345A",
      gstin: null,
      orgType: "TRUST",
      has12ARegistration: true,
      registrationDate12A: new Date("2008-04-01"),
      has80GRegistration: true,
      pfEstablishmentCode: "KN/BNG/0123456",
      esicCode: "53-12345-67",
      ptRegNo: "PTKA12345678",
      bankAccountIfsc: "HDFC0000123",
      bankAccountNo: "5010001234567",
      responsiblePersonName: "Dr. Latha Krishnan",
      responsiblePersonDesignation: "Principal & Authorised Signatory",
      signatoryPan: "AAAPL2345R",
    },
  });

  console.log("📋 Compliance calendar (12 months / 4 quarters)...");
  const now = new Date();
  const fy = fyOf(now);
  const monthly = ["TDS_PAYMENT", "PF", "ESI", "PT", "EPF_ECR"] as const;
  const quarterly = ["TDS_24Q", "TDS_26Q"] as const;

  for (const t of monthly) {
    for (let i = -2; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const due = dueDateFor(t as any, { month, year });
      const status = due < now ? (Math.random() < 0.85 ? "FILED" : "OVERDUE") : "PENDING";
      await db.compliancePeriod.create({
        data: {
          schoolId: school.id, type: t, month, quarter: 0, year,
          dueDate: due, status,
          filedAt: status === "FILED" ? new Date(due.getTime() - 86400000 * ri(0, 5)) : null,
          challanRef: status === "FILED" ? `${t}-${year}${String(month).padStart(2,"0")}-${ri(100000, 999999)}` : null,
        },
      });
    }
  }
  for (const t of quarterly) {
    for (const fyS of [fy.fyStart - 1, fy.fyStart]) {
      for (let q = 1; q <= 4; q++) {
        const due = dueDateFor(t as any, { quarter: q, year: fyS });
        const status = due < now ? (Math.random() < 0.85 ? "FILED" : "OVERDUE") : "PENDING";
        await db.compliancePeriod.create({
          data: {
            schoolId: school.id, type: t, month: 0, quarter: q, year: fyS,
            dueDate: due, status,
            filedAt: status === "FILED" ? new Date(due.getTime() - 86400000) : null,
          },
        });
      }
    }
  }
  // Annual Form 16 — for previous FY
  await db.compliancePeriod.create({
    data: { schoolId: school.id, type: "FORM16", month: 0, quarter: 0, year: fy.fyStart - 1,
            dueDate: dueDateFor("FORM16", { year: fy.fyStart - 1 }), status: "PENDING" },
  });
  await db.compliancePeriod.create({
    data: { schoolId: school.id, type: "FORM16", month: 0, quarter: 0, year: fy.fyStart,
            dueDate: dueDateFor("FORM16", { year: fy.fyStart }), status: "PENDING" },
  });

  console.log("💼 TDS challans (last 6 months — salary + non-salary)...");
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, ri(5, 7));
    // Salary TDS — sum of monthly TDS
    const slips = await db.payslip.findMany({ where: { schoolId: school.id, month: d.getMonth() + 1, year: d.getFullYear() } });
    const tds = slips.reduce((s, p) => s + p.tds, 0);
    if (tds > 0) {
      await db.tdsChallan.create({
        data: {
          schoolId: school.id, type: "TDS_SALARY",
          bsrCode: "0240016", challanNo: String(50000 + i * 10),
          challanDate: d, amount: tds,
          bankName: "HDFC Bank · Whitefield", section: "192",
          quarter: quarterOf(d.getMonth()) as number, year: fyOf(d).fyStart,
        },
      });
    }
  }

  console.log("🏗️ Vendor PAN + default TDS section...");
  const vendors = await db.vendor.findMany({ where: { schoolId: school.id } });
  const sections = ["194C", "194J", "194I", "194H", "194C"] as const;
  for (let i = 0; i < vendors.length; i++) {
    await db.vendor.update({
      where: { id: vendors[i].id },
      data: {
        pan: ["AABCS7890K","AABPB1234L","AABCD5678M","AABCR2345N","AAACK1234P"][i] ?? null,
        defaultTdsSection: sections[i % sections.length],
      },
    });
  }

  console.log("💳 Sample vendor TDS deductions (10)...");
  const vrefresh = await db.vendor.findMany({ where: { schoolId: school.id } });
  for (let i = 0; i < 10; i++) {
    const v = vrefresh[i % vrefresh.length];
    const sec = (v.defaultTdsSection ?? "194C") as any;
    const gross = ri(50000, 200000) * 100; // ₹50k - ₹2L
    const r = calculateVendorTds({
      section: sec, grossAmount: gross,
      deducteeType: "OTHER",
      rentClass: "LAND_BUILDING_FURNITURE",
      panFurnished: !!v.pan,
      ytdAmountToVendor: i * gross,
    });
    const paidAt = new Date(now.getTime() - ri(0, 60) * 86400000);
    await db.vendorTdsDeduction.create({
      data: {
        schoolId: school.id, vendorId: v.id,
        invoiceRef: `${v.name.split(" ")[0].toUpperCase()}-INV-${1000 + i}`,
        section: sec,
        natureOfPayment: rand(["Stationery supply","Annual maintenance","Audit fees","Office rent","Sports equipment","Cleaning services","Lab consumables","Furniture repair"]),
        grossAmount: gross,
        tdsRate: r.rate,
        tdsAmount: r.tdsAmount,
        netAmount: r.netAmount,
        panFurnished: !!v.pan,
        paidAt,
        quarter: quarterOf(paidAt.getMonth()) as number,
        year: fyOf(paidAt).fyStart,
      },
    });
  }

  console.log("📄 Form 16 issuance for previous FY...");
  const allStaff = await db.staff.findMany({ where: { schoolId: school.id } });
  const prevFy = fy.fyStart - 1;
  const prevFyLabel = `${prevFy}-${String((prevFy + 1) % 100).padStart(2, "0")}`;
  let f16count = 0;
  for (const st of allStaff.slice(0, 8)) {
    // Synthesize a few payslips for prev FY so Form 16 has data
    const struct = await db.salaryStructure.findFirst({ where: { staffId: st.id }, orderBy: { effectiveFrom: "desc" } });
    if (!struct) continue;
    for (let mIdx = 0; mIdx < 12; mIdx++) {
      const d = new Date(prevFy, 3 + mIdx, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const gross = struct.basic + struct.hra + struct.da + struct.special + struct.transport;
      const pf = Math.round(struct.basic * 0.12);
      const esi = gross < 25_000_00 ? Math.round(gross * 0.0075) : 0;
      const tds = struct.tdsMonthly || Math.round(gross * 0.08);
      const totalDed = pf + esi + tds;
      await db.payslip.upsert({
        where: { staffId_month_year: { staffId: st.id, month, year } },
        update: {},
        create: {
          schoolId: school.id, staffId: st.id, month, year,
          workedDays: 30, lopDays: 0,
          basic: struct.basic, hra: struct.hra, da: struct.da, special: struct.special, transport: struct.transport,
          gross, pf, esi, tds, totalDeductions: totalDed, net: gross - totalDed,
          status: "PAID",
          paidAt: new Date(year, month - 1, 28),
        },
      });
    }
    // Now run form16For
    const f = await form16For(school.id, st.id, prevFy);
    if (!f) continue;
    await db.form16Issuance.create({
      data: {
        schoolId: school.id, staffId: st.id, financialYear: prevFyLabel,
        totalGross: f.totalGross,
        totalDeductions: f.standardDeduction + f.hraExemption + f.chapter6A + f.homeLoanInterest,
        totalTaxDeducted: f.tdsActuallyDeducted,
        partBGenerated: true,
        certificateNo: `F16/${st.employeeId}/${prevFyLabel}`,
        issuedAt: f16count < 3 ? new Date() : null,
        issuedToEmail: f16count < 3 ? (await db.user.findUnique({ where: { id: st.userId } }))?.email : null,
      },
    });
    f16count++;
  }
  console.log(`   generated ${f16count} Form 16 records for FY ${prevFyLabel}`);

  console.log("\n✅ Tax seed complete.");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => db.$disconnect());
