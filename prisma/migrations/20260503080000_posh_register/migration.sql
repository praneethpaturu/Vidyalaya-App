-- PoSH (Prevention of Sexual Harassment) Act 2013 register.

CREATE TABLE "PoshComplaint" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "caseNo" TEXT NOT NULL,
  "filedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "filedById" TEXT,
  "complainantName" TEXT NOT NULL,
  "complainantRole" TEXT,
  "respondentName" TEXT NOT NULL,
  "respondentRole" TEXT,
  "incidentDate" TIMESTAMP(3),
  "incidentLocation" TEXT,
  "natureOfIncident" TEXT NOT NULL,
  "evidenceUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'FILED',
  "closedAt" TIMESTAMP(3),
  "closingNote" TEXT,
  "recommendation" TEXT,
  "actionTaken" TEXT,
  CONSTRAINT "PoshComplaint_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PoshComplaint_schoolId_caseNo_key" ON "PoshComplaint"("schoolId","caseNo");
CREATE INDEX "PoshComplaint_schoolId_status_idx" ON "PoshComplaint"("schoolId","status");

CREATE TABLE "PoshHearing" (
  "id" TEXT NOT NULL,
  "complaintId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "attendees" TEXT,
  "notes" TEXT,
  "outcome" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PoshHearing_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PoshHearing_complaintId_fkey" FOREIGN KEY ("complaintId") REFERENCES "PoshComplaint"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PoshHearing_complaintId_scheduledAt_idx" ON "PoshHearing"("complaintId","scheduledAt");

-- Scheduled report subscriptions.
CREATE TABLE "ReportSubscription" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "preset" TEXT NOT NULL,
  "cadence" TEXT NOT NULL DEFAULT 'WEEKLY',
  "recipients" TEXT NOT NULL DEFAULT '[]',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "nextRunAt" TIMESTAMP(3) NOT NULL,
  "lastRunAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReportSubscription_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ReportSubscription_active_nextRunAt_idx" ON "ReportSubscription"("active","nextRunAt");
CREATE INDEX "ReportSubscription_schoolId_idx" ON "ReportSubscription"("schoolId");

-- Push token registry.
CREATE TABLE "PushToken" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "platform" TEXT NOT NULL DEFAULT 'WEB',
  "deviceTag" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PushToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PushToken_userId_token_key" ON "PushToken"("userId","token");
CREATE INDEX "PushToken_userId_active_idx" ON "PushToken"("userId","active");
