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

// Generates a `:root { --brand: ... }` block when an override is set.
// Tailwind reads --brand-50 .. --brand-900 in tailwind.config; this overrides
// just --brand-700 (used by btn-primary) for a quick visual override.
export function brandStyleBlock(brand: BrandSnapshot | null): string | null {
  if (!brand?.brandPrimary) return null;
  // Sanitise hex
  const hex = /^#[0-9a-fA-F]{3,6}$/.test(brand.brandPrimary) ? brand.brandPrimary : null;
  if (!hex) return null;
  return `:root { --brand-700: ${hex}; --brand-600: ${hex}; --brand-50: ${hex}1a; }`;
}
