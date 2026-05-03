-- Admissions masters, application form, student promotion log, monthly attendance.

CREATE TABLE "EnquirySource" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isDigitalCampaign" BOOLEAN NOT NULL DEFAULT false,
  "showAtBranchForm" BOOLEAN NOT NULL DEFAULT true,
  "showAtOnlineForm" BOOLEAN NOT NULL DEFAULT true,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnquirySource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EnquirySource_schoolId_name_key" ON "EnquirySource"("schoolId","name");
CREATE INDEX "EnquirySource_schoolId_active_idx" ON "EnquirySource"("schoolId","active");

CREATE TABLE "EnquiryStage" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "level" INTEGER NOT NULL DEFAULT 1,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "isLeadCancel" BOOLEAN NOT NULL DEFAULT false,
  "dateCaptureEnabled" BOOLEAN NOT NULL DEFAULT false,
  "parentVisitOrSchoolTour" BOOLEAN NOT NULL DEFAULT false,
  "parentStageId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnquiryStage_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EnquiryStage_schoolId_name_key" ON "EnquiryStage"("schoolId","name");
CREATE INDEX "EnquiryStage_schoolId_active_idx" ON "EnquiryStage"("schoolId","active");
CREATE INDEX "EnquiryStage_parentStageId_idx" ON "EnquiryStage"("parentStageId");

CREATE TABLE "StudentPromotion" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "fromAcademicYear" TEXT NOT NULL,
  "toAcademicYear" TEXT NOT NULL,
  "fromClassId" TEXT,
  "toClassId" TEXT,
  "type" TEXT NOT NULL,
  "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "promotedById" TEXT,
  "reverted" BOOLEAN NOT NULL DEFAULT false,
  "revertedAt" TIMESTAMP(3),
  "revertedById" TEXT,
  "notes" TEXT,
  CONSTRAINT "StudentPromotion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StudentPromotion_schoolId_toAcademicYear_idx" ON "StudentPromotion"("schoolId","toAcademicYear");
CREATE INDEX "StudentPromotion_studentId_idx" ON "StudentPromotion"("studentId");

CREATE TABLE "MonthlyAttendance" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "year" INTEGER NOT NULL,
  "month" INTEGER NOT NULL,
  "workingDays" INTEGER NOT NULL DEFAULT 0,
  "presentDays" INTEGER NOT NULL DEFAULT 0,
  "lateDays" INTEGER NOT NULL DEFAULT 0,
  "earlyLeaveDays" INTEGER NOT NULL DEFAULT 0,
  "remarks" TEXT,
  "enteredById" TEXT,
  "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MonthlyAttendance_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MonthlyAttendance_studentId_year_month_key" ON "MonthlyAttendance"("studentId","year","month");
CREATE INDEX "MonthlyAttendance_schoolId_year_month_idx" ON "MonthlyAttendance"("schoolId","year","month");
CREATE INDEX "MonthlyAttendance_classId_year_month_idx" ON "MonthlyAttendance"("classId","year","month");

CREATE TABLE "ApplicationForm" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "enquiryId" TEXT,
  "applicationNo" TEXT NOT NULL,
  "studentFirstName" TEXT NOT NULL,
  "studentLastName" TEXT,
  "studentDob" TIMESTAMP(3),
  "studentGender" TEXT,
  "optingClassId" TEXT,
  "optingClassName" TEXT,
  "admissionType" TEXT,
  "fatherName" TEXT,
  "fatherEmail" TEXT,
  "fatherPhone" TEXT,
  "motherName" TEXT,
  "motherEmail" TEXT,
  "motherPhone" TEXT,
  "address" TEXT,
  "previousSchool" TEXT,
  "vaccineStatus" TEXT,
  "needsTransport" BOOLEAN NOT NULL DEFAULT false,
  "documents" TEXT NOT NULL DEFAULT '[]',
  "applicationFee" INTEGER NOT NULL DEFAULT 0,
  "feePaid" BOOLEAN NOT NULL DEFAULT false,
  "feeReceiptNo" TEXT,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "expectedReportingDate" TIMESTAMP(3),
  "admittedStudentId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ApplicationForm_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ApplicationForm_schoolId_applicationNo_key" ON "ApplicationForm"("schoolId","applicationNo");
CREATE INDEX "ApplicationForm_schoolId_status_idx" ON "ApplicationForm"("schoolId","status");
CREATE INDEX "ApplicationForm_enquiryId_idx" ON "ApplicationForm"("enquiryId");
