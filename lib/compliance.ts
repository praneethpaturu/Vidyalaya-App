// Compliance engine — quarterly aggregation, Form 16, EPF ECR, due-date calculator.

import { prisma } from "./db";
import { calculateTax, type Regime } from "./tax";

// FY helpers — Indian FY runs April 1 → March 31
export function fyOf(date: Date): { fyStart: number; fyEnd: number; label: string } {
  const m = date.getMonth();
  const y = m >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return { fyStart: y, fyEnd: y + 1, label: `${y}-${String((y + 1) % 100).padStart(2, "0")}` };
}

export function quarterOf(month: number): 1 | 2 | 3 | 4 {
  // FY quarters: Q1=Apr-Jun, Q2=Jul-Sep, Q3=Oct-Dec, Q4=Jan-Mar
  if (month >= 3 && month <= 5) return 1;
  if (month >= 6 && month <= 8) return 2;
  if (month >= 9 && month <= 11) return 3;
  return 4;
}

export function fyMonthsForQuarter(q: 1 | 2 | 3 | 4, fyStart: number): { month: number; year: number }[] {
  // Returns the 3 calendar months in FY quarter q
  const blocks = {
    1: [{ m: 3, y: fyStart }, { m: 4, y: fyStart }, { m: 5, y: fyStart }],
    2: [{ m: 6, y: fyStart }, { m: 7, y: fyStart }, { m: 8, y: fyStart }],
    3: [{ m: 9, y: fyStart }, { m: 10, y: fyStart }, { m: 11, y: fyStart }],
    4: [{ m: 0, y: fyStart + 1 }, { m: 1, y: fyStart + 1 }, { m: 2, y: fyStart + 1 }],
  } as const;
  return blocks[q].map((b) => ({ month: b.m + 1, year: b.y }));
}

// ---------- Due-date calculator -------------------------------------------------
// Returns the statutory due date for a given filing.
export function dueDateFor(
  type: "TDS_PAYMENT" | "TDS_24Q" | "TDS_26Q" | "PF" | "ESI" | "PT" | "GSTR1" | "GSTR3B" | "FORM16" | "EPF_ECR",
  period: { month?: number; quarter?: number; year: number }
): Date {
  switch (type) {
    case "TDS_PAYMENT":
      // Salary TDS deposit: by 7th of next month (April → 30 April for March)
      return monthDueDate(period.month!, period.year, 7);
    case "TDS_24Q": {
      // Q1: 31 Jul, Q2: 31 Oct, Q3: 31 Jan, Q4: 31 May (next FY)
      const q = period.quarter!;
      const map = { 1: { m: 6, d: 31 }, 2: { m: 9, d: 31 }, 3: { m: 0, d: 31 }, 4: { m: 4, d: 31 } } as const;
      const x = map[q as 1|2|3|4];
      const y = q === 4 ? period.year + 1 : (q === 3 ? period.year + 1 : period.year);
      return new Date(y, x.m, x.d);
    }
    case "TDS_26Q":
      // Same as 24Q
      return dueDateFor("TDS_24Q", period);
    case "PF":
    case "EPF_ECR":
      // EPF: 15th of following month
      return monthDueDate(period.month!, period.year, 15);
    case "ESI":
      // ESI: 15th of following month
      return monthDueDate(period.month!, period.year, 15);
    case "PT":
      // Karnataka: 20th of following month
      return monthDueDate(period.month!, period.year, 20);
    case "GSTR1":
      // GSTR-1: 11th of following month
      return monthDueDate(period.month!, period.year, 11);
    case "GSTR3B":
      // GSTR-3B: 20th of following month
      return monthDueDate(period.month!, period.year, 20);
    case "FORM16":
      // Annual: 15th June following FY end
      return new Date(period.year + 1, 5, 15);
  }
}

function monthDueDate(month: number, year: number, day: number): Date {
  // month here is 1-12, returns due date in (month+1)
  const m = month % 12;
  const y = month === 12 ? year + 1 : year;
  return new Date(y, m, day);
}

// ---------- Late fee / interest hints ------------------------------------------
export function lateFeeHint(type: string, daysLate: number, taxAmount: number): string {
  if (daysLate <= 0) return "On time.";
  switch (type) {
    case "TDS_PAYMENT":
      return `Interest u/s 201(1A) @ 1.5% per month from deduction date. Approx ₹${Math.round(taxAmount * 0.015 * Math.ceil(daysLate / 30) / 100).toLocaleString("en-IN")}.`;
    case "TDS_24Q":
    case "TDS_26Q":
      return `Late filing fee u/s 234E @ ₹200/day, max equal to TDS amount. Currently ₹${Math.min(daysLate * 200, Math.round(taxAmount / 100)).toLocaleString("en-IN")}.`;
    case "PF":
    case "EPF_ECR":
      return `Damages u/s 14B @ 5%-25% p.a. + interest @ 12% p.a. Significant — file ASAP.`;
    case "ESI":
      return `Interest @ 12% p.a. Damages 5%-25% p.a. depending on delay.`;
    case "GSTR3B":
      return `Late fee ₹50/day (₹20/day for nil returns) + interest @ 18% p.a. on tax liability.`;
    case "GSTR1":
      return `Late fee ₹50/day (₹20/day nil) capped at ₹5,000 per return.`;
    default:
      return "Late filing penalties may apply.";
  }
}

// ---------- Form 24Q quarterly aggregator --------------------------------------
export type Form24QRow = {
  staffId: string;
  employeeId: string;
  pan: string | null;
  name: string;
  designation: string;
  monthsCovered: number;
  totalGross: number;
  totalTds: number;
  totalEpf: number;
  totalEsi: number;
};

export type Form24QSummary = {
  schoolId: string;
  fyStart: number;
  quarter: 1 | 2 | 3 | 4;
  rows: Form24QRow[];
  totalEmployees: number;
  totalGross: number;
  totalTds: number;
};

export async function form24QFor(schoolId: string, fyStart: number, quarter: 1 | 2 | 3 | 4): Promise<Form24QSummary> {
  const months = fyMonthsForQuarter(quarter, fyStart);
  const slips = await prisma.payslip.findMany({
    where: {
      schoolId,
      OR: months.map((m) => ({ month: m.month, year: m.year })),
    },
    include: { staff: { include: { user: true } } },
  });
  const byStaff = new Map<string, Form24QRow>();
  for (const s of slips) {
    const k = s.staffId;
    if (!byStaff.has(k)) {
      byStaff.set(k, {
        staffId: s.staffId,
        employeeId: s.staff.employeeId,
        pan: s.staff.pan,
        name: s.staff.user.name,
        designation: s.staff.designation,
        monthsCovered: 0,
        totalGross: 0,
        totalTds: 0,
        totalEpf: 0,
        totalEsi: 0,
      });
    }
    const row = byStaff.get(k)!;
    row.monthsCovered++;
    row.totalGross += s.gross;
    row.totalTds += s.tds;
    row.totalEpf += s.pf;
    row.totalEsi += s.esi;
  }
  const rows = Array.from(byStaff.values()).sort((a, b) => a.employeeId.localeCompare(b.employeeId));
  return {
    schoolId, fyStart, quarter, rows,
    totalEmployees: rows.length,
    totalGross: rows.reduce((s, r) => s + r.totalGross, 0),
    totalTds: rows.reduce((s, r) => s + r.totalTds, 0),
  };
}

// ---------- Form 16 Part B annual computation ----------------------------------
export type Form16PartB = {
  staffId: string;
  employeeId: string;
  pan: string | null;
  name: string;
  designation: string;
  fyLabel: string;
  monthsWorked: number;
  totalGross: number;
  totalBasic: number;
  totalHra: number;
  totalDa: number;
  totalSpecial: number;
  totalTransport: number;
  totalEpf: number;
  totalEsi: number;
  standardDeduction: number;
  hraExemption: number;
  chapter6A: number;
  homeLoanInterest: number;
  taxableIncome: number;
  baseTax: number;
  rebate87A: number;
  surcharge: number;
  cess: number;
  totalTax: number;
  tdsActuallyDeducted: number;
  refundOrPayable: number;
  regime: Regime;
};

export async function form16For(schoolId: string, staffId: string, fyStart: number): Promise<Form16PartB | null> {
  const fyLabel = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`;
  const slips = await prisma.payslip.findMany({
    where: {
      schoolId, staffId,
      OR: [
        { year: fyStart, month: { in: [4, 5, 6, 7, 8, 9, 10, 11, 12] } },
        { year: fyStart + 1, month: { in: [1, 2, 3] } },
      ],
    },
    orderBy: [{ year: "asc" }, { month: "asc" }],
  });
  if (slips.length === 0) return null;
  const staff = await prisma.staff.findUnique({ where: { id: staffId }, include: { user: true } });
  if (!staff) return null;
  const decl = await prisma.taxDeclaration.findUnique({
    where: { staffId_financialYear: { staffId, financialYear: fyLabel } },
  });

  const totalBasic = slips.reduce((s, p) => s + p.basic, 0);
  const totalHra = slips.reduce((s, p) => s + p.hra, 0);
  const totalDa = slips.reduce((s, p) => s + p.da, 0);
  const totalSpecial = slips.reduce((s, p) => s + p.special, 0);
  const totalTransport = slips.reduce((s, p) => s + p.transport, 0);
  const totalGross = totalBasic + totalHra + totalDa + totalSpecial + totalTransport;
  const totalEpf = slips.reduce((s, p) => s + p.pf, 0);
  const totalEsi = slips.reduce((s, p) => s + p.esi, 0);
  const tdsActuallyDeducted = slips.reduce((s, p) => s + p.tds, 0);
  const regime = (decl?.regime as Regime) ?? "NEW";

  const tax = calculateTax({
    basicAnnual: totalBasic,
    hraAnnual: totalHra,
    daAnnual: totalDa,
    specialAnnual: totalSpecial,
    transportAnnual: totalTransport,
    regime,
    s80C: decl?.s80C ?? 0,
    s80D: decl?.s80D ?? 0,
    s80CCD1B: decl?.s80CCD1B ?? 0,
    hraRentPaid: decl?.hraRentPaid ?? 0,
    hraMetro: decl?.hraMetro ?? true,
    homeLoanInterest: decl?.homeLoanInterest ?? 0,
    otherIncome: decl?.otherIncome ?? 0,
  });

  return {
    staffId, employeeId: staff.employeeId, pan: staff.pan,
    name: staff.user.name, designation: staff.designation,
    fyLabel, monthsWorked: slips.length,
    totalGross, totalBasic, totalHra, totalDa, totalSpecial, totalTransport,
    totalEpf, totalEsi,
    standardDeduction: tax.standardDeduction,
    hraExemption: tax.hraExemption,
    chapter6A: tax.chapter6A,
    homeLoanInterest: tax.homeLoanInterest,
    taxableIncome: tax.taxableIncome,
    baseTax: tax.baseTax,
    rebate87A: tax.rebate87A,
    surcharge: tax.surcharge,
    cess: tax.cess,
    totalTax: tax.totalTax,
    tdsActuallyDeducted,
    refundOrPayable: tdsActuallyDeducted - tax.totalTax, // +ve = refund, -ve = additional
    regime,
  };
}

// ---------- EPF Electronic Challan-cum-Return (ECR) ----------------------------
// Format reference: EPFO ECR v2.0 — pipe-separated, one line per employee
// Member-ID | Name | EPF Wages | EPS Wages | EDLI Wages | EPF Contribution
//   | EPS Contribution | EPF + EPS Diff | NCP Days | Refund of Advances
// All amounts as integers (rupees, no paise).
export async function epfEcrText(schoolId: string, month: number, year: number): Promise<string> {
  const slips = await prisma.payslip.findMany({
    where: { schoolId, month, year },
    include: { staff: { include: { user: true } } },
    orderBy: { staff: { employeeId: "asc" } },
  });
  const lines = slips.map((s) => {
    const memberId = s.staff.employeeId;
    const name = s.staff.user.name.replace(/\|/g, " ");
    // EPF wages capped at ₹15,000 per EPFO rules
    const cappedBasic = Math.min(s.basic, 15_000_00);
    const epfWages = Math.round(cappedBasic / 100);
    const epfContrib = Math.round(s.pf / 100);
    const epsWages = epfWages;
    const epsContrib = Math.round(epfWages * 0.0833);
    const edliWages = epfWages;
    const epfEpsDiff = Math.max(0, epfContrib - epsContrib);
    return [memberId, name, epfWages, epsWages, edliWages, epfContrib, epsContrib, epfEpsDiff, 0, 0].join("#~#");
  });
  return lines.join("\n");
}

// ---------- Compliance calendar -------------------------------------------------
export type CalendarItem = {
  type: string;
  label: string;
  dueDate: Date;
  period: string;
  status: string;
  daysToDue: number;
  amountHint?: number;
};

export async function complianceCalendar(schoolId: string, lookaheadDays = 90): Promise<CalendarItem[]> {
  const now = new Date(); now.setHours(0,0,0,0);
  const horizon = new Date(now); horizon.setDate(horizon.getDate() + lookaheadDays);
  const periods = await prisma.compliancePeriod.findMany({
    where: { schoolId, dueDate: { gte: new Date(now.getTime() - 30 * 86400000), lte: horizon } },
    orderBy: { dueDate: "asc" },
  });
  const labels: Record<string, string> = {
    PF: "EPF monthly", ESI: "ESI monthly", TDS: "TDS deposit (s.192)", PT: "Professional Tax",
    TDS_24Q: "Form 24Q (Salary TDS return)",
    TDS_26Q: "Form 26Q (Vendor TDS return)",
    GSTR1: "GSTR-1", GSTR3B: "GSTR-3B",
    FORM16: "Form 16 issuance", EPF_ECR: "EPF ECR", ESIC_RC: "ESIC return",
  };
  return periods.map((p) => ({
    type: p.type,
    label: labels[p.type] ?? p.type,
    dueDate: p.dueDate,
    period: p.quarter > 0 ? `Q${p.quarter} FY${p.year}-${String((p.year+1)%100).padStart(2,"0")}` : `${MONTHS[p.month - 1]} ${p.year}`,
    status: p.status,
    daysToDue: Math.round((p.dueDate.getTime() - now.getTime()) / 86400000),
    amountHint: p.amount,
  }));
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

// ---------- Form 26Q quarterly aggregation (vendor TDS) -----------------------
export type Form26QRow = {
  vendorId: string;
  vendorName: string;
  pan: string | null;
  section: string;
  natureOfPayment: string | null;
  panFurnished: boolean;
  totalGrossPaise: number;
  totalTdsPaise: number;
  deductionCount: number;
};
export type Form26QSummary = {
  schoolId: string;
  fyStart: number;
  quarter: 1 | 2 | 3 | 4;
  rows: Form26QRow[];
  totalVendors: number;
  totalGross: number;
  totalTds: number;
};
export async function form26QFor(schoolId: string, fyStart: number, quarter: 1 | 2 | 3 | 4): Promise<Form26QSummary> {
  // Quarter labels at filing time use fyStart's calendar; deductions are
  // stamped with `(quarter, year)` per the Indian assessment-year mapping.
  const fyEnd = fyStart + 1;
  const ds = await prisma.vendorTdsDeduction.findMany({
    where: {
      schoolId,
      quarter,
      OR: [{ year: fyStart }, { year: fyEnd }],
    },
    include: { vendor: true },
  });
  const byKey = new Map<string, Form26QRow>();
  for (const d of ds) {
    const k = `${d.vendorId}::${d.section}`;
    if (!byKey.has(k)) {
      byKey.set(k, {
        vendorId: d.vendorId,
        vendorName: d.vendor.name,
        pan: d.vendor.pan,
        section: d.section,
        natureOfPayment: d.natureOfPayment,
        panFurnished: d.panFurnished,
        totalGrossPaise: 0,
        totalTdsPaise: 0,
        deductionCount: 0,
      });
    }
    const r = byKey.get(k)!;
    r.totalGrossPaise += d.grossAmount;
    r.totalTdsPaise += d.tdsAmount;
    r.deductionCount++;
    if (!d.panFurnished) r.panFurnished = false;
  }
  const rows = Array.from(byKey.values()).sort((a, b) =>
    a.vendorName.localeCompare(b.vendorName) || a.section.localeCompare(b.section));
  return {
    schoolId, fyStart, quarter, rows,
    totalVendors: new Set(rows.map((r) => r.vendorId)).size,
    totalGross: rows.reduce((s, r) => s + r.totalGrossPaise, 0),
    totalTds: rows.reduce((s, r) => s + r.totalTdsPaise, 0),
  };
}

// ---------- Form 16A: per-vendor TDS certificate per quarter ------------------
export type Form16AData = {
  vendorId: string;
  vendorName: string;
  pan: string | null;
  fyLabel: string;
  quarter: 1 | 2 | 3 | 4;
  bySection: Array<{
    section: string;
    natureOfPayment: string | null;
    deductions: Array<{
      deductionId: string;
      paidAt: Date;
      grossPaise: number;
      tdsRate: number;
      tdsPaise: number;
      challanNo: string | null;
      certificateNo: string | null;
    }>;
    totalGrossPaise: number;
    totalTdsPaise: number;
  }>;
  totalGrossPaise: number;
  totalTdsPaise: number;
};
export async function form16AFor(
  schoolId: string,
  vendorId: string,
  fyStart: number,
  quarter: 1 | 2 | 3 | 4,
): Promise<Form16AData | null> {
  const fyLabel = `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`;
  const ds = await prisma.vendorTdsDeduction.findMany({
    where: {
      schoolId,
      vendorId,
      quarter,
      OR: [{ year: fyStart }, { year: fyStart + 1 }],
    },
    include: { vendor: true },
    orderBy: { paidAt: "asc" },
  });
  if (ds.length === 0) return null;
  const vendor = ds[0].vendor;
  // Resolve challans separately — VendorTdsDeduction has challanId but
  // no Prisma relation defined back to TdsChallan in this schema.
  const challanIds = Array.from(new Set(ds.map((d) => d.challanId).filter((id): id is string => !!id)));
  const challansById = new Map<string, { challanNo: string }>();
  if (challanIds.length) {
    const rows = await prisma.tdsChallan.findMany({
      where: { id: { in: challanIds } },
      select: { id: true, challanNo: true },
    });
    for (const r of rows) challansById.set(r.id, { challanNo: r.challanNo });
  }
  const bySection = new Map<string, Form16AData["bySection"][number]>();
  for (const d of ds) {
    if (!bySection.has(d.section)) {
      bySection.set(d.section, {
        section: d.section,
        natureOfPayment: d.natureOfPayment,
        deductions: [],
        totalGrossPaise: 0,
        totalTdsPaise: 0,
      });
    }
    const sec = bySection.get(d.section)!;
    sec.deductions.push({
      deductionId: d.id,
      paidAt: d.paidAt,
      grossPaise: d.grossAmount,
      tdsRate: d.tdsRate,
      tdsPaise: d.tdsAmount,
      challanNo: d.challanId ? challansById.get(d.challanId)?.challanNo ?? null : null,
      certificateNo: d.certificateNo,
    });
    sec.totalGrossPaise += d.grossAmount;
    sec.totalTdsPaise += d.tdsAmount;
  }
  const totalGrossPaise = ds.reduce((s, d) => s + d.grossAmount, 0);
  const totalTdsPaise = ds.reduce((s, d) => s + d.tdsAmount, 0);
  return {
    vendorId,
    vendorName: vendor.name,
    pan: vendor.pan,
    fyLabel,
    quarter,
    bySection: Array.from(bySection.values()),
    totalGrossPaise,
    totalTdsPaise,
  };
}
