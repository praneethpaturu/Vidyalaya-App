"use client";

import { useLocale } from "./I18nClient";
import { Languages } from "lucide-react";

/**
 * Compact language switcher for the header. Toggle between English and
 * Hindi. Persists via the i18n provider (localStorage + cookie).
 */
export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label="Language"
      data-i18n-skip
      className="inline-flex items-center gap-0.5 bg-slate-100 rounded-full p-0.5 ring-1 ring-slate-200"
    >
      <button
        type="button"
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
        title="Switch to English"
        className={`px-2.5 h-7 rounded-full text-[11px] font-semibold tracking-wide transition-colors duration-150 ${
          locale === "en" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale("hi")}
        aria-pressed={locale === "hi"}
        title="हिंदी पर स्विच करें"
        className={`px-2.5 h-7 rounded-full text-[12px] font-semibold transition-colors duration-150 ${
          locale === "hi" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
        }`}
        style={{ fontFamily: 'var(--font-noto), "Noto Sans Devanagari", system-ui' }}
      >
        हिं
      </button>
    </div>
  );
}
