import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Money helpers — store paise (int) end-to-end.
export const toPaise = (rupees: number) => Math.round(rupees * 100);
export const toRupees = (paise: number) => paise / 100;
export const inr = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format((paise ?? 0) / 100);

export const fmtDate = (d: Date | string | null | undefined, opts?: Intl.DateTimeFormatOptions) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleDateString("en-IN", opts ?? { day: "2-digit", month: "short", year: "numeric" });
};

export const fmtDateTime = (d: Date | string | null | undefined) => {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
};

export const initials = (name: string) =>
  name.split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("");

// Class theme palette (pastel) — mirrors Google Classroom illustrated banners.
export const CLASS_THEMES = ["pink", "peach", "mint", "sky", "lavender", "rose", "sand", "sage"] as const;
export type ClassTheme = (typeof CLASS_THEMES)[number];

export function pickTheme(seed: string): ClassTheme {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
  return CLASS_THEMES[Math.abs(h) % CLASS_THEMES.length];
}
