// BRD §4.4 — White-Labeling. Resolves a tenant's brand colour + tagline
// for inline-CSS injection. Returns null when no overrides are set so we
// fall through to the default `--brand` palette in tailwind.config.

import { prisma } from "./db";

export type BrandSnapshot = {
  schoolId: string;
  schoolName: string;
  brandPrimary: string | null;
  brandTagline: string | null;
  customDomain: string | null;
  logoUrl: string | null;
  watermarkAll: boolean;
};

export async function brandFor(schoolId: string | null | undefined): Promise<BrandSnapshot | null> {
  if (!schoolId) return null;
  const s = await prisma.school.findUnique({
    where: { id: schoolId },
    select: { id: true, name: true, brandPrimary: true, brandTagline: true, customDomain: true, logoUrl: true, watermarkAll: true },
  });
  if (!s) return null;
  return {
    schoolId: s.id,
    schoolName: s.name,
    brandPrimary: s.brandPrimary,
    brandTagline: s.brandTagline,
    customDomain: s.customDomain,
    logoUrl: s.logoUrl,
    watermarkAll: s.watermarkAll,
  };
}

// Generates a `:root { ... }` block overriding the tenant's brand colour.
// Tailwind reads `var(--color-brand-700)` etc. (see tailwind.config.ts) so
// we override THOSE variables, not bare `--brand-700`. We also derive a
// readable subset of shades from the primary by simple hex math.
export function brandStyleBlock(brand: BrandSnapshot | null): string | null {
  if (!brand?.brandPrimary) return null;
  const hex = /^#[0-9a-fA-F]{6}$/.test(brand.brandPrimary) ? brand.brandPrimary : null;
  if (!hex) return null;
  // Tints: blend with white at varying ratios to derive 50-300; shades blend
  // with black for 800-900. Crude but produces a usable palette from one hex.
  const c = parseHex(hex);
  const tint = (pct: number) => toHex(blend(c, [255, 255, 255], pct));
  const shade = (pct: number) => toHex(blend(c, [0, 0, 0], pct));
  return [
    `:root {`,
    `  --color-brand-50:  ${tint(0.92)};`,
    `  --color-brand-100: ${tint(0.84)};`,
    `  --color-brand-200: ${tint(0.66)};`,
    `  --color-brand-300: ${tint(0.46)};`,
    `  --color-brand-400: ${tint(0.22)};`,
    `  --color-brand-500: ${hex};`,
    `  --color-brand-600: ${shade(0.12)};`,
    `  --color-brand-700: ${shade(0.24)};`,
    `  --color-brand-800: ${shade(0.40)};`,
    `  --color-brand-900: ${shade(0.55)};`,
    `}`,
  ].join("\n");
}
function parseHex(h: string): [number, number, number] {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
}
function blend(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t), Math.round(a[2] + (b[2] - a[2]) * t)];
}
function toHex(rgb: [number, number, number]): string {
  return "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
}
