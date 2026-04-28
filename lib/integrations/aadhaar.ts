// Aadhaar masking + verification helpers.
// We DO NOT store full Aadhaar numbers anywhere — only the last 4 digits
// after masking. e-KYC verification (when enabled) uses UIDAI's AUA/KUA
// flow via a registered ASA partner; for demo we just shape-validate.

const VALID = /^\d{12}$/;

/** Normalize input (strip spaces / dashes). */
export function normalize(input: string): string {
  return String(input ?? "").replace(/[\s-]/g, "");
}

/** Mask all but the last 4 digits. */
export function mask(input: string): string {
  const n = normalize(input);
  if (!VALID.test(n)) return "INVALID";
  return `XXXX-XXXX-${n.slice(-4)}`;
}

/** Shape-only validation (Verhoeff omitted for brevity). */
export function isShapeValid(input: string): boolean {
  return VALID.test(normalize(input));
}

/** Check if a stored mask matches a freshly-entered Aadhaar. */
export function masksMatch(stored: string, entered: string): boolean {
  return mask(entered) === stored && stored !== "INVALID";
}
