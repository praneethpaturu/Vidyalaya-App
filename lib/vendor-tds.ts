// Vendor TDS engine — Section 194 series of the Income Tax Act, FY 2026-27.
// All amounts in paise.
//
// Key sections covered:
//  - 194C  : Payments to contractors  (1% individual/HUF, 2% others)        threshold: ₹30,000 per contract / ₹1,00,000 aggregate
//  - 194J  : Professional / technical fees                                  threshold: ₹50,000 (₹30,000 for technical post-FY24)
//  - 194I  : Rent — 2% (plant & machinery), 10% (land/building/furniture)   threshold: ₹2,40,000 p.a.
//  - 194H  : Commission / brokerage  (2%)                                   threshold: ₹20,000 (Budget 2024 raised from ₹15k)
//  - 194A  : Interest other than securities  (10%)                          threshold: ₹50,000 (sr. citizens), ₹40,000 others
//  - 206AA : PAN not furnished → higher of (table rate, 20%, twice rate)    no threshold

export type Section = "194C" | "194J" | "194I" | "194H" | "194A" | "NONE";
export type DeducteeType = "INDIVIDUAL_HUF" | "OTHER";
export type RentClass = "PLANT_MACHINERY" | "LAND_BUILDING_FURNITURE";

export type VendorTdsInput = {
  section: Section;
  grossAmount: number;       // paise, gross invoice/payment
  deducteeType?: DeducteeType;
  rentClass?: RentClass;     // for s194I
  panFurnished?: boolean;    // false → s206AA
  // For threshold checks across the year:
  ytdAmountToVendor?: number; // paise, total previously paid this FY (not incl. current)
  perContractAmount?: number; // paise, single-contract amount (s194C)
};

export type VendorTdsResult = {
  section: Section;
  applicable: boolean;
  reason: string;
  rate: number;          // %
  tdsAmount: number;     // paise
  netAmount: number;     // paise paid to vendor
  thresholdRule: string;
};

const RATES: Record<Section, { individualHUF?: number; other?: number; flat?: number; rentPM?: number; rentLand?: number }> = {
  "194C": { individualHUF: 1.0, other: 2.0 },
  "194J": { flat: 10.0 },
  "194I": { rentPM: 2.0, rentLand: 10.0 },
  "194H": { flat: 2.0 },          // Budget 2024 reduced 5% → 2%
  "194A": { flat: 10.0 },
  "NONE": {},
};

const THRESHOLDS = {
  "194C_per_contract": 30_000_00,   // ₹30,000
  "194C_aggregate":    1_00_000_00, // ₹1,00,000
  "194J":              50_000_00,   // ₹50,000
  "194I":              2_40_000_00, // ₹2,40,000 p.a.
  "194H":              20_000_00,   // ₹20,000
  "194A":              40_000_00,   // ₹40,000
};

export function calculateVendorTds(input: VendorTdsInput): VendorTdsResult {
  const gross = input.grossAmount;
  const ytd = input.ytdAmountToVendor ?? 0;
  const totalAfter = ytd + gross;

  if (input.section === "NONE") {
    return { section: "NONE", applicable: false, reason: "No TDS section configured for vendor.", rate: 0, tdsAmount: 0, netAmount: gross, thresholdRule: "—" };
  }

  // Threshold checks
  let applicable = false;
  let thresholdRule = "";
  if (input.section === "194C") {
    const perContract = input.perContractAmount ?? gross;
    if (perContract > THRESHOLDS["194C_per_contract"] || totalAfter > THRESHOLDS["194C_aggregate"]) {
      applicable = true;
      thresholdRule = `s194C threshold met (>₹30k single OR >₹1L aggregate FY)`;
    } else {
      thresholdRule = "Below s194C threshold (₹30k/contract or ₹1L aggregate)";
    }
  } else if (input.section === "194J") {
    if (totalAfter > THRESHOLDS["194J"]) {
      applicable = true;
      thresholdRule = "s194J threshold ₹50,000 p.a. met";
    } else thresholdRule = "Below s194J threshold ₹50,000";
  } else if (input.section === "194I") {
    if (totalAfter > THRESHOLDS["194I"]) {
      applicable = true;
      thresholdRule = "s194I threshold ₹2,40,000 p.a. met";
    } else thresholdRule = "Below s194I threshold ₹2,40,000";
  } else if (input.section === "194H") {
    if (totalAfter > THRESHOLDS["194H"]) {
      applicable = true;
      thresholdRule = "s194H threshold ₹20,000 met (Budget 2024)";
    } else thresholdRule = "Below s194H threshold ₹20,000";
  } else if (input.section === "194A") {
    if (totalAfter > THRESHOLDS["194A"]) {
      applicable = true;
      thresholdRule = "s194A threshold ₹40,000 met";
    } else thresholdRule = "Below s194A threshold";
  }

  if (!applicable) {
    return { section: input.section, applicable: false, reason: thresholdRule, rate: 0, tdsAmount: 0, netAmount: gross, thresholdRule };
  }

  // Pick the table rate
  let rate = 0;
  const t = RATES[input.section];
  if (input.section === "194C") rate = (input.deducteeType === "OTHER" ? t.other : t.individualHUF) ?? 0;
  else if (input.section === "194I") rate = (input.rentClass === "LAND_BUILDING_FURNITURE" ? t.rentLand : t.rentPM) ?? 0;
  else rate = t.flat ?? 0;

  // s206AA — PAN not furnished
  let reason = `s${input.section} applies @ ${rate}%`;
  if (input.panFurnished === false) {
    const higherOf = Math.max(rate, 20, rate * 2);
    if (higherOf > rate) {
      rate = higherOf;
      reason += `; s206AA: PAN not furnished, raised to ${rate}%`;
    }
  }

  const tdsAmount = Math.round(gross * rate / 100);
  return {
    section: input.section,
    applicable: true,
    reason,
    rate,
    tdsAmount,
    netAmount: gross - tdsAmount,
    thresholdRule,
  };
}

export const SECTION_DESCRIPTIONS: Record<Section, string> = {
  "194C": "Contractor / sub-contractor",
  "194J": "Professional or technical fees",
  "194I": "Rent of land, building, plant or machinery",
  "194H": "Commission or brokerage",
  "194A": "Interest other than on securities",
  "NONE": "No TDS applicable",
};
