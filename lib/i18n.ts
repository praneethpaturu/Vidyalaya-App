// Minimal i18n shim. Uses a flat dictionary per locale and a `t()` helper
// that falls back to the English source string when a key is missing.
//
// Migration path to next-intl: replace this file with `useTranslations`
// from next-intl. Keys are flat (no nested objects) so the move is clean.

export type Locale = "en" | "hi" | "te" | "ta" | "kn" | "mr" | "ml";

export const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "हिन्दी (Hindi)" },
  { code: "te", label: "తెలుగు (Telugu)" },
  { code: "ta", label: "தமிழ் (Tamil)" },
  { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
  { code: "mr", label: "मराठी (Marathi)" },
  { code: "ml", label: "മലയാളം (Malayalam)" },
];

const DICTIONARY: Record<Locale, Record<string, string>> = {
  en: {},  // English source — t(key) returns the key itself if not overridden
  hi: {
    "Welcome back": "वापस स्वागत है",
    "Sign in": "साइन इन करें",
    "Email": "ईमेल",
    "Password": "पासवर्ड",
    "Sign out": "साइन आउट",
    "Students": "विद्यार्थी",
    "Staff": "कर्मचारी",
    "Attendance": "उपस्थिति",
    "Fees": "शुल्क",
    "Concerns": "शिकायतें",
    "Settings": "सेटिंग्स",
  },
  te: {
    "Welcome back": "తిరిగి స్వాగతం",
    "Sign in": "సైన్ ఇన్",
    "Email": "ఇమెయిల్",
    "Password": "పాస్‌వర్డ్",
    "Sign out": "సైన్ అవుట్",
    "Students": "విద్యార్థులు",
    "Staff": "సిబ్బంది",
    "Attendance": "హాజరు",
    "Fees": "ఫీజులు",
  },
  ta: { "Welcome back": "மீண்டும் வரவேற்கிறோம்", "Students": "மாணவர்கள்" },
  kn: { "Welcome back": "ಮತ್ತೆ ಸ್ವಾಗತ", "Students": "ವಿದ್ಯಾರ್ಥಿಗಳು" },
  mr: { "Welcome back": "पुन्हा स्वागत", "Students": "विद्यार्थी" },
  ml: { "Welcome back": "തിരികെ സ്വാഗതം", "Students": "വിദ്യാർത്ഥികൾ" },
};

export function t(key: string, locale: Locale = "en"): string {
  return DICTIONARY[locale]?.[key] ?? key;
}

/** Check whether a locale is "ready" (≥80% coverage) so the UI can warn. */
export function localeCoverage(locale: Locale): number {
  if (locale === "en") return 1;
  const enKeys = Object.keys(DICTIONARY.en);
  if (enKeys.length === 0) return DICTIONARY[locale] ? 0.5 : 0;
  return Object.keys(DICTIONARY[locale]).length / enKeys.length;
}
