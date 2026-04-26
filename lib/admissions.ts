// Admission funnel state machine + helpers.

export const ADMISSION_STAGES = [
  "ENQUIRY",
  "APPLICATION",
  "INTERACTION",
  "TOUR",
  "APPLICATION_SUBMITTED",
  "DOCUMENT_SUBMITTED",
  "PRE_ADMISSION_TEST",
  "OFFER",
  "CONFIRMED",
  "ENROLLED",
  "LOST",
] as const;
export type AdmissionStage = (typeof ADMISSION_STAGES)[number];

export const STAGE_LABEL: Record<AdmissionStage, string> = {
  ENQUIRY: "Enquiry",
  APPLICATION: "Application",
  INTERACTION: "Interaction",
  TOUR: "Tour",
  APPLICATION_SUBMITTED: "App Submitted",
  DOCUMENT_SUBMITTED: "Doc Submitted",
  PRE_ADMISSION_TEST: "Pre-Admission Test",
  OFFER: "Offer",
  CONFIRMED: "Confirmed",
  ENROLLED: "Enrolled",
  LOST: "Lost",
};

export const STAGE_COLOR: Record<AdmissionStage, string> = {
  ENQUIRY: "bg-slate-100 text-slate-700",
  APPLICATION: "bg-blue-100 text-blue-700",
  INTERACTION: "bg-violet-100 text-violet-700",
  TOUR: "bg-cyan-100 text-cyan-700",
  APPLICATION_SUBMITTED: "bg-indigo-100 text-indigo-700",
  DOCUMENT_SUBMITTED: "bg-purple-100 text-purple-700",
  PRE_ADMISSION_TEST: "bg-amber-100 text-amber-700",
  OFFER: "bg-orange-100 text-orange-700",
  CONFIRMED: "bg-emerald-100 text-emerald-700",
  ENROLLED: "bg-green-100 text-green-700",
  LOST: "bg-rose-100 text-rose-700",
};

export const ENQUIRY_SOURCES = [
  "WALK_IN", "WEB", "QR", "CAMPAIGN", "REFERRAL", "NEWSPAPER", "EVENT",
] as const;

export function nextStages(current: AdmissionStage): AdmissionStage[] {
  if (current === "ENROLLED" || current === "LOST") return [];
  // From any active stage you can either advance to the next, or mark as LOST.
  const idx = ADMISSION_STAGES.indexOf(current);
  const next = ADMISSION_STAGES[idx + 1];
  const candidates = next && next !== "LOST" ? [next] : [];
  return [...candidates, "LOST"];
}
