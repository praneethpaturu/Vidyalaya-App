-- Add per-bus shared-secret driver token (nullable; opt-in tracking)
ALTER TABLE "Bus" ADD COLUMN "driverToken" TEXT;
CREATE UNIQUE INDEX "Bus_driverToken_key" ON "Bus"("driverToken");
