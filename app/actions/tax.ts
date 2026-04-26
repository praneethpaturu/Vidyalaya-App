"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { calculateVendorTds, type Section } from "@/lib/vendor-tds";
import { dueDateFor, fyOf, quarterOf, form24QFor, form16For } from "@/lib/compliance";
import { notify } from "@/lib/notify";
import { inr } from "@/lib/utils";

export async function saveOrgTaxProfile(fd: FormData) {
  const session = await auth();
  const u = session!.user as any;
  const data = {
    legalName: String(fd.get("legalName") ?? ""),
    pan: String(fd.get("pan") ?? "") || null,
    tan: String(fd.get("tan") ?? "") || null,
    gstin: String(fd.get("gstin") ?? "") || null,
    cin: String(fd.get("cin") ?? "") || null,
    orgType: String(fd.get("orgType") ?? "TRUST"),
    has12ARegistration: fd.get("has12ARegistration") === "on",
    has80GRegistration: fd.get("has80GRegistration") === "on",
    pfEstablishmentCode: String(fd.get("pfEstablishmentCode") ?? "") || null,
    esicCode: String(fd.get("esicCode") ?? "") || null,
    ptRegNo: String(fd.get("ptRegNo") ?? "") || null,
    bankAccountIfsc: String(fd.get("bankAccountIfsc") ?? "") || null,
    bankAccountNo: String(fd.get("bankAccountNo") ?? "") || null,
    responsiblePersonName: String(fd.get("responsiblePersonName") ?? "") || null,
    responsiblePersonDesignation: String(fd.get("responsiblePersonDesignation") ?? "") || null,
    signatoryPan: String(fd.get("signatoryPan") ?? "") || null,
  };
  await prisma.orgTaxProfile.upsert({
    where: { schoolId: u.schoolId },
    update: data,
    create: { schoolId: u.schoolId, ...data },
  });
  await audit("UPDATE_ORG_TAX_PROFILE", { entity: "OrgTaxProfile", summary: `Updated org tax profile (PAN ${data.pan ?? "—"}, TAN ${data.tan ?? "—"})` });
  revalidatePath("/tax/profile");
}

export async function recordTdsChallan(fd: FormData) {
  const session = await auth();
  const u = session!.user as any;
  const data = {
    schoolId: u.schoolId,
    type: String(fd.get("type") ?? "TDS_SALARY"),
    bsrCode: String(fd.get("bsrCode") ?? ""),
    challanNo: String(fd.get("challanNo") ?? ""),
    challanDate: new Date(String(fd.get("challanDate") ?? new Date().toISOString())),
    amount: Math.round(Number(fd.get("amount") ?? 0) * 100),
    bankName: String(fd.get("bankName") ?? "") || null,
    section: String(fd.get("section") ?? "") || null,
    quarter: fd.get("quarter") ? Number(fd.get("quarter")) : null,
    year: Number(fd.get("year") ?? new Date().getFullYear()),
    notes: String(fd.get("notes") ?? "") || null,
  };
  const ch = await prisma.tdsChallan.create({ data });
  await audit("RECORD_TDS_CHALLAN", {
    entity: "TdsChallan", entityId: ch.id,
    summary: `Recorded ${data.type} challan ${data.bsrCode}/${data.challanNo} for ${inr(data.amount)}`,
    meta: data,
  });
  revalidatePath("/tax/challans");
  revalidatePath("/tax/calendar");
}

export async function recordVendorTds(fd: FormData) {
  const session = await auth();
  const u = session!.user as any;
  const vendorId = String(fd.get("vendorId"));
  const grossAmount = Math.round(Number(fd.get("grossAmount") ?? 0) * 100);
  const section = (String(fd.get("section") ?? "194C")) as Section;
  const deducteeType = String(fd.get("deducteeType") ?? "OTHER") as any;
  const rentClass = String(fd.get("rentClass") ?? "LAND_BUILDING_FURNITURE") as any;
  const panFurnished = fd.get("panFurnished") !== "off";
  const invoiceRef = String(fd.get("invoiceRef") ?? "") || null;
  const natureOfPayment = String(fd.get("natureOfPayment") ?? "");

  // YTD aggregate to this vendor
  const fy = fyOf(new Date());
  const prev = await prisma.vendorTdsDeduction.aggregate({
    where: { schoolId: u.schoolId, vendorId, year: fy.fyStart },
    _sum: { grossAmount: true },
  });
  const ytd = prev._sum.grossAmount ?? 0;

  const result = calculateVendorTds({
    section, grossAmount, deducteeType, rentClass, panFurnished,
    ytdAmountToVendor: ytd,
  });

  const now = new Date();
  const dedn = await prisma.vendorTdsDeduction.create({
    data: {
      schoolId: u.schoolId, vendorId, invoiceRef,
      section, natureOfPayment,
      grossAmount, tdsRate: result.rate, tdsAmount: result.tdsAmount,
      netAmount: result.netAmount,
      panFurnished,
      paidAt: now,
      quarter: quarterOf(now.getMonth()),
      year: fy.fyStart,
    },
  });
  await audit("RECORD_VENDOR_TDS", {
    entity: "VendorTdsDeduction", entityId: dedn.id,
    summary: `${result.applicable ? "Deducted" : "No TDS"} ${inr(result.tdsAmount)} (s${section} @ ${result.rate}%) on ${inr(grossAmount)} to vendor`,
    meta: { rate: result.rate, applicable: result.applicable, threshold: result.thresholdRule },
  });
  revalidatePath("/tax/vendor-tds");
}

export async function fileForm24Q(fd: FormData) {
  const session = await auth();
  const u = session!.user as any;
  const fyStart = Number(fd.get("fyStart"));
  const quarter = Number(fd.get("quarter")) as 1 | 2 | 3 | 4;

  const summary = await form24QFor(u.schoolId, fyStart, quarter);
  const due = dueDateFor("TDS_24Q", { quarter, year: fyStart });

  const period = await prisma.compliancePeriod.upsert({
    where: { schoolId_type_month_quarter_year: { schoolId: u.schoolId, type: "TDS_24Q", month: 0, quarter, year: fyStart } },
    update: { status: "FILED", filedAt: new Date(), amount: summary.totalTds },
    create: {
      schoolId: u.schoolId, type: "TDS_24Q", month: 0, quarter, year: fyStart,
      dueDate: due, amount: summary.totalTds, status: "FILED", filedAt: new Date(),
    },
  });
  await audit("FILE_24Q", {
    entity: "CompliancePeriod", entityId: period.id,
    summary: `Filed Form 24Q for Q${quarter} FY${fyStart}-${String((fyStart+1)%100).padStart(2,"0")} — ${summary.totalEmployees} employees, total TDS ${inr(summary.totalTds)}`,
    meta: { totalTds: summary.totalTds, totalEmployees: summary.totalEmployees, totalGross: summary.totalGross },
  });
  revalidatePath("/tax/24q");
  revalidatePath("/tax/calendar");
}

export async function generateForm16ForAll(fyStart: number) {
  const session = await auth();
  const u = session!.user as any;
  const fyLabel = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`;
  const staffList = await prisma.staff.findMany({ where: { schoolId: u.schoolId } });
  let count = 0;
  for (const st of staffList) {
    const f = await form16For(u.schoolId, st.id, fyStart);
    if (!f) continue;
    const certNo = `F16/${st.employeeId}/${fyLabel}`;
    await prisma.form16Issuance.upsert({
      where: { staffId_financialYear: { staffId: st.id, financialYear: fyLabel } },
      update: {
        totalGross: f.totalGross,
        totalDeductions: f.standardDeduction + f.hraExemption + f.chapter6A + f.homeLoanInterest,
        totalTaxDeducted: f.tdsActuallyDeducted,
        partBGenerated: true,
        certificateNo: certNo,
      },
      create: {
        schoolId: u.schoolId, staffId: st.id, financialYear: fyLabel,
        totalGross: f.totalGross,
        totalDeductions: f.standardDeduction + f.hraExemption + f.chapter6A + f.homeLoanInterest,
        totalTaxDeducted: f.tdsActuallyDeducted,
        partBGenerated: true,
        certificateNo: certNo,
      },
    });
    count++;
  }
  await audit("GENERATE_FORM16", { entity: "Form16Issuance", summary: `Generated Form 16 Part B for ${count} employees, FY ${fyLabel}` });
  revalidatePath("/tax/form16");
}

export async function issueForm16ToEmployee(issuanceId: string) {
  const session = await auth();
  const u = session!.user as any;
  const iss = await prisma.form16Issuance.findUnique({
    where: { id: issuanceId },
    include: { staff: { include: { user: true } } },
  });
  if (!iss) return;
  await prisma.form16Issuance.update({
    where: { id: issuanceId },
    data: { issuedToEmail: iss.staff.user.email, issuedAt: new Date() },
  });
  await notify({
    schoolId: u.schoolId, channel: "EMAIL",
    toEmail: iss.staff.user.email,
    subject: `Form 16 for FY ${iss.financialYear} — ${iss.certificateNo}`,
    body: `Dear ${iss.staff.user.name},\n\nYour Form 16 (Part B) for financial year ${iss.financialYear} is now available. Certificate no: ${iss.certificateNo}.\n\nDownload from your portal.\n\n— Payroll team`,
    template: "FORM16_ISSUED",
  });
  await audit("ISSUE_FORM16", {
    entity: "Form16Issuance", entityId: iss.id,
    summary: `Issued Form 16 to ${iss.staff.user.name} for FY ${iss.financialYear}`,
  });
  revalidatePath("/tax/form16");
}

// Generate the next 12 months / 4 quarters of pending compliance items so the
// calendar always has upcoming entries.
export async function seedComplianceCalendar() {
  const session = await auth();
  const u = session!.user as any;
  const now = new Date();
  const monthly = ["TDS_PAYMENT", "PF", "ESI", "PT", "EPF_ECR"] as const;
  const quarterly = ["TDS_24Q", "TDS_26Q"] as const;
  const fy = fyOf(now);

  // Monthly: this month + next 11
  for (const t of monthly) {
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      const due = dueDateFor(t as any, { month, year });
      await prisma.compliancePeriod.upsert({
        where: { schoolId_type_month_quarter_year: { schoolId: u.schoolId, type: t, month, quarter: 0, year } },
        update: {},
        create: { schoolId: u.schoolId, type: t, month, quarter: 0, year, dueDate: due, status: "PENDING" },
      });
    }
  }
  // Quarterly: 4 quarters of current + next FY
  for (const t of quarterly) {
    for (let q = 1; q <= 4; q++) {
      for (const fyS of [fy.fyStart, fy.fyStart + 1]) {
        const due = dueDateFor(t as any, { quarter: q, year: fyS });
        await prisma.compliancePeriod.upsert({
          where: { schoolId_type_month_quarter_year: { schoolId: u.schoolId, type: t, month: 0, quarter: q, year: fyS } },
          update: {},
          create: { schoolId: u.schoolId, type: t, month: 0, quarter: q, year: fyS, dueDate: due, status: "PENDING" },
        });
      }
    }
  }
  // Annual Form 16 for current and prev FY
  for (const fyS of [fy.fyStart - 1, fy.fyStart]) {
    const due = dueDateFor("FORM16", { year: fyS });
    await prisma.compliancePeriod.upsert({
      where: { schoolId_type_month_quarter_year: { schoolId: u.schoolId, type: "FORM16", month: 0, quarter: 0, year: fyS } },
      update: {},
      create: { schoolId: u.schoolId, type: "FORM16", month: 0, quarter: 0, year: fyS, dueDate: due, status: "PENDING" },
    });
  }
  await audit("SEED_COMPLIANCE_CALENDAR", { summary: "Seeded compliance calendar with upcoming filings" });
  revalidatePath("/tax/calendar");
}

// Send reminders for filings due within N days that haven't been filed
export async function sendComplianceReminders(daysAhead = 7) {
  const session = await auth();
  const u = session!.user as any;
  const now = new Date(); now.setHours(0,0,0,0);
  const horizon = new Date(now); horizon.setDate(horizon.getDate() + daysAhead);

  const due = await prisma.compliancePeriod.findMany({
    where: {
      schoolId: u.schoolId,
      status: "PENDING",
      dueDate: { gte: now, lte: horizon },
    },
  });

  const recipients = await prisma.user.findMany({
    where: { schoolId: u.schoolId, role: { in: ["ADMIN","PRINCIPAL","ACCOUNTANT","HR_MANAGER"] } },
  });

  for (const d of due) {
    const subject = `Compliance reminder: ${d.type} due ${d.dueDate.toLocaleDateString("en-IN")}`;
    const body = `${d.type} for ${d.quarter > 0 ? `Q${d.quarter}` : `${d.month}/${d.year}`} is due on ${d.dueDate.toLocaleDateString("en-IN")}. Please ensure timely filing to avoid late fees.`;
    for (const r of recipients) {
      await notify({ schoolId: u.schoolId, channel: "INAPP", toUserId: r.id, subject, body, template: "COMPLIANCE_REMINDER" });
      await notify({ schoolId: u.schoolId, channel: "EMAIL", toEmail: r.email, subject, body, template: "COMPLIANCE_REMINDER" });
    }
  }
  await audit("SEND_COMPLIANCE_REMINDERS", { summary: `Sent reminders for ${due.length} upcoming filings to ${recipients.length} recipients` });
  return due.length;
}
