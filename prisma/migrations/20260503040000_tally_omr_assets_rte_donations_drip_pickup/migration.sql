-- Tally exports, OMR sheets, fixed assets + depreciation, RTE quota,
-- alumni donations, drip campaigns, pickup requests.

CREATE TABLE "TallyExport" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "fromDate" TIMESTAMP(3) NOT NULL,
  "toDate" TIMESTAMP(3) NOT NULL,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "generatedById" TEXT,
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TallyExport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "TallyExport_schoolId_generatedAt_idx" ON "TallyExport"("schoolId","generatedAt");

CREATE TABLE "OMRSheet" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "examSubjectId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "questionCount" INTEGER NOT NULL DEFAULT 0,
  "optionCount" INTEGER NOT NULL DEFAULT 4,
  "marksPerCorrect" DOUBLE PRECISION NOT NULL DEFAULT 1,
  "negativeMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "answerKey" TEXT NOT NULL DEFAULT '[]',
  "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OMRSheet_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OMRSheet_examSubjectId_key" ON "OMRSheet"("examSubjectId");

CREATE TABLE "OMRResponse" (
  "id" TEXT NOT NULL,
  "sheetId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "responses" TEXT NOT NULL DEFAULT '[]',
  "scoredMarks" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "scannedById" TEXT,
  CONSTRAINT "OMRResponse_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "OMRResponse_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "OMRSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "OMRResponse_sheetId_studentId_key" ON "OMRResponse"("sheetId","studentId");

CREATE TABLE "FixedAsset" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "assetCode" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'OTHER',
  "purchaseDate" TIMESTAMP(3) NOT NULL,
  "purchaseCost" INTEGER NOT NULL,
  "vendor" TEXT,
  "location" TEXT,
  "depreciationMethod" TEXT NOT NULL DEFAULT 'STRAIGHT_LINE',
  "usefulLifeYears" INTEGER NOT NULL DEFAULT 5,
  "wdvRatePct" DOUBLE PRECISION NOT NULL DEFAULT 15,
  "salvageValue" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "disposedAt" TIMESTAMP(3),
  "disposalNotes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FixedAsset_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "FixedAsset_schoolId_assetCode_key" ON "FixedAsset"("schoolId","assetCode");
CREATE INDEX "FixedAsset_schoolId_status_idx" ON "FixedAsset"("schoolId","status");

CREATE TABLE "AssetDepreciationEntry" (
  "id" TEXT NOT NULL,
  "assetId" TEXT NOT NULL,
  "fy" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "method" TEXT NOT NULL,
  "bookValueAfter" INTEGER NOT NULL,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AssetDepreciationEntry_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AssetDepreciationEntry_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "FixedAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AssetDepreciationEntry_assetId_fy_key" ON "AssetDepreciationEntry"("assetId","fy");

CREATE TABLE "RTEAdmission" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "fy" TEXT NOT NULL,
  "district" TEXT,
  "category" TEXT,
  "documentUrl" TEXT,
  "approvedAt" TIMESTAMP(3),
  "approvedById" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RTEAdmission_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RTEAdmission_studentId_key" ON "RTEAdmission"("studentId");
CREATE INDEX "RTEAdmission_schoolId_fy_idx" ON "RTEAdmission"("schoolId","fy");

CREATE TABLE "AlumniDonation" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "alumniProfileId" TEXT,
  "donorName" TEXT NOT NULL,
  "donorEmail" TEXT,
  "donorPhone" TEXT,
  "donorPan" TEXT,
  "amount" INTEGER NOT NULL,
  "purpose" TEXT,
  "pledgedAt" TIMESTAMP(3),
  "receivedAt" TIMESTAMP(3),
  "receiptNo" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PLEDGED',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlumniDonation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AlumniDonation_schoolId_receiptNo_key" ON "AlumniDonation"("schoolId","receiptNo");
CREATE INDEX "AlumniDonation_schoolId_status_idx" ON "AlumniDonation"("schoolId","status");

CREATE TABLE "DripCampaign" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "audience" TEXT NOT NULL DEFAULT 'ALL',
  "classId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DripCampaign_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DripCampaign_schoolId_active_idx" ON "DripCampaign"("schoolId","active");

CREATE TABLE "DripStep" (
  "id" TEXT NOT NULL,
  "campaignId" TEXT NOT NULL,
  "sequence" INTEGER NOT NULL,
  "delayDays" INTEGER NOT NULL DEFAULT 0,
  "channel" TEXT NOT NULL DEFAULT 'SMS',
  "subject" TEXT,
  "body" TEXT NOT NULL,
  CONSTRAINT "DripStep_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DripStep_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "DripCampaign"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "DripStep_campaignId_sequence_key" ON "DripStep"("campaignId","sequence");

CREATE TABLE "DripEnrollment" (
  "id" TEXT NOT NULL,
  "stepId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "sentAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  CONSTRAINT "DripEnrollment_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "DripEnrollment_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "DripStep"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "DripEnrollment_scheduledAt_status_idx" ON "DripEnrollment"("scheduledAt","status");
CREATE INDEX "DripEnrollment_stepId_userId_idx" ON "DripEnrollment"("stepId","userId");

CREATE TABLE "PickupRequest" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "requestedById" TEXT NOT NULL,
  "pickupAt" TIMESTAMP(3) NOT NULL,
  "reason" TEXT NOT NULL,
  "pickerName" TEXT,
  "pickerPhone" TEXT,
  "pickerRelation" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "decidedById" TEXT,
  "decidedAt" TIMESTAMP(3),
  "decisionNote" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PickupRequest_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PickupRequest_schoolId_status_pickupAt_idx" ON "PickupRequest"("schoolId","status","pickupAt");
CREATE INDEX "PickupRequest_studentId_idx" ON "PickupRequest"("studentId");
