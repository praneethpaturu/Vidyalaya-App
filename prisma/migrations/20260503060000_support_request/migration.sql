-- SupportRequest — backs the Help-menu actions (Raise ticket, Book training,
-- Book CSM meeting, Give feedback). Single table with a type discriminator.

CREATE TABLE "SupportRequest" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "requestedById" TEXT,
  "requestedByName" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "preferredAt" TIMESTAMP(3),
  "rating" INTEGER,
  "contactPhone" TEXT,
  "contactEmail" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "scheduledAt" TIMESTAMP(3),
  "resolutionNote" TEXT,
  "resolvedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SupportRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "SupportRequest_schoolId_type_status_idx" ON "SupportRequest"("schoolId","type","status");
CREATE INDEX "SupportRequest_schoolId_createdAt_idx" ON "SupportRequest"("schoolId","createdAt");
