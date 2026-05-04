-- Professional Tax column on Payslip. State-slab driven; default 0 keeps
-- existing rows valid until a recompute pass runs.
ALTER TABLE "Payslip" ADD COLUMN IF NOT EXISTS "pt" INTEGER NOT NULL DEFAULT 0;
