-- Extend TaxDeclaration with: 80CCD(2), 80E, 80TTA/TTB, bonus, perquisites,
-- and an age band so the tax engine can pick the right old-regime slabs.
ALTER TABLE "TaxDeclaration"
  ADD COLUMN IF NOT EXISTS "s80CCD2"          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "s80E"             INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "s80TTA"           INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "bonusAnnual"      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "perquisitesAnnual" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "ageBand"          TEXT    NOT NULL DEFAULT 'NORMAL';
