-- Holiday master, inter-branch transfer log, exam invigilator + seating.

CREATE TABLE "Holiday" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "date" TIMESTAMP(3) NOT NULL,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'PUBLIC',
  "fullDay" BOOLEAN NOT NULL DEFAULT true,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Holiday_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Holiday_schoolId_date_key" ON "Holiday"("schoolId","date");
CREATE INDEX "Holiday_schoolId_date_idx" ON "Holiday"("schoolId","date");

CREATE TABLE "StudentTransfer" (
  "id" TEXT NOT NULL,
  "fromSchoolId" TEXT NOT NULL,
  "toSchoolId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "newStudentId" TEXT,
  "effectiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reason" TEXT,
  "initiatedById" TEXT,
  "status" TEXT NOT NULL DEFAULT 'INITIATED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentTransfer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "StudentTransfer_fromSchoolId_status_idx" ON "StudentTransfer"("fromSchoolId","status");
CREATE INDEX "StudentTransfer_toSchoolId_status_idx" ON "StudentTransfer"("toSchoolId","status");

CREATE TABLE "ExamInvigilator" (
  "id" TEXT NOT NULL,
  "examSubjectId" TEXT NOT NULL,
  "staffId" TEXT NOT NULL,
  "room" TEXT,
  "notes" TEXT,
  CONSTRAINT "ExamInvigilator_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExamInvigilator_examSubjectId_staffId_key" ON "ExamInvigilator"("examSubjectId","staffId");
CREATE INDEX "ExamInvigilator_examSubjectId_idx" ON "ExamInvigilator"("examSubjectId");

CREATE TABLE "ExamSeating" (
  "id" TEXT NOT NULL,
  "examSubjectId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "room" TEXT NOT NULL,
  "rowNo" INTEGER NOT NULL,
  "seatNo" INTEGER NOT NULL,
  CONSTRAINT "ExamSeating_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExamSeating_examSubjectId_studentId_key" ON "ExamSeating"("examSubjectId","studentId");
CREATE INDEX "ExamSeating_examSubjectId_room_idx" ON "ExamSeating"("examSubjectId","room");
