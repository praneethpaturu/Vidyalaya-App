// DigiLocker integration — issues government-recognized PDFs (TC, transcript,
// bonafide, ID card) into a citizen's DigiLocker account.
//
// Real production needs:
//   • Onboarding as an Issuer at https://partners.digilocker.gov.in
//   • A DOC_TYPE registered (e.g. "TRNCRT" for transcripts)
//   • mTLS or OAuth2 client cert
//
// In stub mode (no DIGILOCKER_PARTNER_ID set), we simulate a successful
// issuance with a fake URI so the rest of the app exercises end-to-end.

import crypto from "crypto";

export type IssueInput = {
  studentName: string;
  guardianName?: string;
  dob: string;          // YYYY-MM-DD
  pan?: string;
  aadhaarLast4?: string;
  docType: "TC" | "TRANSCRIPT" | "BONAFIDE" | "ID_CARD";
  pdfBase64: string;    // the pre-generated PDF
  schoolName: string;
};

export type IssueResult = {
  ok: boolean;
  uri?: string;         // DigiLocker URI (e.g. in.gov.school.LSE.tc-2026-1234)
  provider: "digilocker" | "stub";
  error?: string;
};

export function digilockerConfigured(): boolean {
  return !!(process.env.DIGILOCKER_PARTNER_ID && process.env.DIGILOCKER_API_KEY);
}

export async function issue(input: IssueInput): Promise<IssueResult> {
  if (!digilockerConfigured()) {
    const uri = `in.gov.school.STUB.${input.docType.toLowerCase()}-${crypto.randomBytes(4).toString("hex")}`;
    return { ok: true, uri, provider: "stub" };
  }
  // Real call would POST to DigiLocker partner API. Skipped here.
  return { ok: false, provider: "digilocker", error: "Live DigiLocker call not implemented" };
}
