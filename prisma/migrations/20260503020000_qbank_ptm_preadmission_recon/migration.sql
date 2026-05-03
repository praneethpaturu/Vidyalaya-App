-- Question Bank, PTM, Pre-Admission Exams, Bank Reconciliation.

CREATE TABLE "QuestionBankItem" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "classId" TEXT,
  "subjectId" TEXT,
  "chapter" TEXT,
  "topic" TEXT,
  "text" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'MCQ',
  "options" TEXT NOT NULL DEFAULT '[]',
  "correct" TEXT NOT NULL DEFAULT '[]',
  "marks" INTEGER NOT NULL DEFAULT 1,
  "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
  "tags" TEXT NOT NULL DEFAULT '[]',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionBankItem_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "QuestionBankItem_schoolId_classId_subjectId_idx" ON "QuestionBankItem"("schoolId","classId","subjectId");
CREATE INDEX "QuestionBankItem_schoolId_active_idx" ON "QuestionBankItem"("schoolId","active");

CREATE TABLE "PTM" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "classId" TEXT,
  "title" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "durationMin" INTEGER NOT NULL DEFAULT 60,
  "venue" TEXT,
  "notes" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PTM_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PTM_schoolId_scheduledAt_idx" ON "PTM"("schoolId","scheduledAt");

CREATE TABLE "PTMFeedback" (
  "id" TEXT NOT NULL,
  "ptmId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "attended" BOOLEAN NOT NULL DEFAULT false,
  "parentName" TEXT,
  "feedback" TEXT,
  "followUp" TEXT,
  "rating" INTEGER,
  "recordedById" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PTMFeedback_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PTMFeedback_ptmId_fkey" FOREIGN KEY ("ptmId") REFERENCES "PTM"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PTMFeedback_ptmId_studentId_key" ON "PTMFeedback"("ptmId","studentId");

CREATE TABLE "PreAdmissionExam" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "optingClass" TEXT,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "durationMin" INTEGER NOT NULL DEFAULT 60,
  "venue" TEXT,
  "totalMarks" INTEGER NOT NULL DEFAULT 100,
  "passMarks" INTEGER NOT NULL DEFAULT 35,
  "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PreAdmissionExam_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PreAdmissionExam_schoolId_scheduledAt_idx" ON "PreAdmissionExam"("schoolId","scheduledAt");

CREATE TABLE "PreAdmissionExamSubject" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "maxMarks" INTEGER NOT NULL DEFAULT 20,
  "sequence" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PreAdmissionExamSubject_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PreAdmissionExamSubject_examId_fkey" FOREIGN KEY ("examId") REFERENCES "PreAdmissionExam"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PreAdmissionExamSubject_examId_name_key" ON "PreAdmissionExamSubject"("examId","name");

CREATE TABLE "PreAdmissionCandidate" (
  "id" TEXT NOT NULL,
  "examId" TEXT NOT NULL,
  "applicationId" TEXT,
  "candidateName" TEXT NOT NULL,
  "parentPhone" TEXT,
  "hallTicketNo" TEXT NOT NULL,
  "attendance" TEXT NOT NULL DEFAULT 'PENDING',
  "totalScore" INTEGER NOT NULL DEFAULT 0,
  "result" TEXT NOT NULL DEFAULT 'PENDING',
  "remarks" TEXT,
  "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PreAdmissionCandidate_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PreAdmissionCandidate_examId_fkey" FOREIGN KEY ("examId") REFERENCES "PreAdmissionExam"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PreAdmissionCandidate_examId_hallTicketNo_key" ON "PreAdmissionCandidate"("examId","hallTicketNo");

CREATE TABLE "PreAdmissionScore" (
  "id" TEXT NOT NULL,
  "candidateId" TEXT NOT NULL,
  "examSubjectId" TEXT NOT NULL,
  "marks" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "PreAdmissionScore_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PreAdmissionScore_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "PreAdmissionCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PreAdmissionScore_examSubjectId_fkey" FOREIGN KEY ("examSubjectId") REFERENCES "PreAdmissionExamSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "PreAdmissionScore_candidateId_examSubjectId_key" ON "PreAdmissionScore"("candidateId","examSubjectId");

CREATE TABLE "BankStatementImport" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "fileName" TEXT,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedById" TEXT,
  "rowCount" INTEGER NOT NULL DEFAULT 0,
  "matchedCount" INTEGER NOT NULL DEFAULT 0,
  "unmatchedCount" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "BankStatementImport_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "BankStatementImport_schoolId_uploadedAt_idx" ON "BankStatementImport"("schoolId","uploadedAt");

CREATE TABLE "BankStatementRow" (
  "id" TEXT NOT NULL,
  "importId" TEXT NOT NULL,
  "txnDate" TIMESTAMP(3) NOT NULL,
  "description" TEXT NOT NULL,
  "reference" TEXT,
  "debit" INTEGER NOT NULL DEFAULT 0,
  "credit" INTEGER NOT NULL DEFAULT 0,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "matchedPaymentId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'UNMATCHED',
  CONSTRAINT "BankStatementRow_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "BankStatementRow_importId_fkey" FOREIGN KEY ("importId") REFERENCES "BankStatementImport"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "BankStatementRow_importId_status_idx" ON "BankStatementRow"("importId","status");
