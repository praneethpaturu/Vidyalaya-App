-- AddOns: CPD activities, Infirmary visits, PDC register, Recruitment, PMS goals + reviews.

CREATE TABLE "CPDActivity" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'WORKSHOP',
  "hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "certificateUrl" TEXT,
  "notes" TEXT,
  "recordedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CPDActivity_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "CPDActivity_schoolId_staffId_idx" ON "CPDActivity"("schoolId","staffId");
CREATE INDEX "CPDActivity_schoolId_completedAt_idx" ON "CPDActivity"("schoolId","completedAt");

CREATE TABLE "InfirmaryVisit" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "studentId" TEXT,
  "staffId" TEXT,
  "visitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "symptoms" TEXT NOT NULL,
  "diagnosis" TEXT,
  "medication" TEXT,
  "vitals" TEXT,
  "outcome" TEXT NOT NULL DEFAULT 'RETURNED_TO_CLASS',
  "parentNotified" BOOLEAN NOT NULL DEFAULT false,
  "recordedById" TEXT,
  CONSTRAINT "InfirmaryVisit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "InfirmaryVisit_schoolId_visitedAt_idx" ON "InfirmaryVisit"("schoolId","visitedAt");
CREATE INDEX "InfirmaryVisit_studentId_idx" ON "InfirmaryVisit"("studentId");

CREATE TABLE "PDCCheque" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "drawerName" TEXT NOT NULL,
  "drawerPhone" TEXT,
  "bankName" TEXT,
  "chequeNo" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "dueDate" TIMESTAMP(3) NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "depositedAt" TIMESTAMP(3),
  "invoiceId" TEXT,
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PDCCheque_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PDCCheque_schoolId_status_dueDate_idx" ON "PDCCheque"("schoolId","status","dueDate");

CREATE TABLE "JobOpening" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "department" TEXT,
  "employmentType" TEXT NOT NULL DEFAULT 'FULL_TIME',
  "description" TEXT NOT NULL,
  "requirements" TEXT,
  "closeAt" TIMESTAMP(3),
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobOpening_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "JobOpening_schoolId_status_idx" ON "JobOpening"("schoolId","status");

CREATE TABLE "JobApplicant" (
  "id" TEXT NOT NULL,
  "openingId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "resumeUrl" TEXT,
  "currentEmployer" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "notes" TEXT,
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "JobApplicant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "JobApplicant_openingId_fkey" FOREIGN KEY ("openingId") REFERENCES "JobOpening"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "JobApplicant_openingId_status_idx" ON "JobApplicant"("openingId","status");

CREATE TABLE "StaffGoal" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "fy" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "kpi" TEXT,
  "weight" INTEGER NOT NULL DEFAULT 20,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffGoal_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StaffGoal_schoolId_fy_staffId_idx" ON "StaffGoal"("schoolId","fy","staffId");

CREATE TABLE "StaffReview" (
  "id" TEXT NOT NULL,
  "goalId" TEXT NOT NULL,
  "period" TEXT NOT NULL DEFAULT 'MID',
  "rating" INTEGER,
  "comments" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StaffReview_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StaffReview_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "StaffGoal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StaffReview_goalId_period_key" ON "StaffReview"("goalId","period");
