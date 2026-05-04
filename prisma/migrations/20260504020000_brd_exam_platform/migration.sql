-- BRD: Exam Management & Online Assessment SaaS Platform
-- Adds: per-Q overrides, sections, integrity capture, appeal flow,
-- question approval workflow, blueprint/pattern templates, subscription
-- plans, predictive insights, offline sync queue, white-label fields.

-- 1) School — white-label + subscription
ALTER TABLE "School"
  ADD COLUMN IF NOT EXISTS "planKey"       TEXT NOT NULL DEFAULT 'FREE',
  ADD COLUMN IF NOT EXISTS "planExpiresAt" TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "brandPrimary"  TEXT,
  ADD COLUMN IF NOT EXISTS "brandTagline"  TEXT,
  ADD COLUMN IF NOT EXISTS "customDomain"  TEXT,
  ADD COLUMN IF NOT EXISTS "watermarkAll"  BOOLEAN NOT NULL DEFAULT TRUE;

-- 2) OnlineExam — proctoring, lockdown, sectional, adaptive, parent visibility
ALTER TABLE "OnlineExam"
  ADD COLUMN IF NOT EXISTS "fullscreenLock"    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "blockCopyPaste"    BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "blockRightClick"   BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "watermarkContent"  BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "ipMonitor"         BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "sectional"         BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "patternKey"        TEXT,
  ADD COLUMN IF NOT EXISTS "adaptive"          BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "publishResultMode" TEXT NOT NULL DEFAULT 'AFTER_GRADING';

-- 3) OnlineExamSection
CREATE TABLE IF NOT EXISTS "OnlineExamSection" (
  "id"           TEXT PRIMARY KEY,
  "examId"       TEXT NOT NULL,
  "name"         TEXT NOT NULL,
  "order"        INTEGER NOT NULL DEFAULT 0,
  "durationMin"  INTEGER,
  "lockOnSubmit" BOOLEAN NOT NULL DEFAULT TRUE,
  "negativeMark" DOUBLE PRECISION,
  "marksPerQ"    INTEGER,
  CONSTRAINT "OnlineExamSection_examId_fkey" FOREIGN KEY ("examId") REFERENCES "OnlineExam"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "OnlineExamSection_examId_order_idx" ON "OnlineExamSection"("examId","order");

-- 4) OnlineQuestion — section, per-Q overrides, taxonomy, rubric
ALTER TABLE "OnlineQuestion"
  ADD COLUMN IF NOT EXISTS "sectionId"        TEXT,
  ADD COLUMN IF NOT EXISTS "negativeMark"     DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "timeLimitSec"     INTEGER,
  ADD COLUMN IF NOT EXISTS "numericTolerance" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "numericRangeMin"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "numericRangeMax"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "topic"            TEXT,
  ADD COLUMN IF NOT EXISTS "subtopic"         TEXT,
  ADD COLUMN IF NOT EXISTS "bloomLevel"       TEXT,
  ADD COLUMN IF NOT EXISTS "difficulty"       TEXT NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN IF NOT EXISTS "rubric"           TEXT;
ALTER TABLE "OnlineQuestion"
  DROP CONSTRAINT IF EXISTS "OnlineQuestion_sectionId_fkey";
ALTER TABLE "OnlineQuestion"
  ADD CONSTRAINT "OnlineQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "OnlineExamSection"("id") ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS "OnlineQuestion_sectionId_idx" ON "OnlineQuestion"("sectionId");

-- 5) OnlineExamAttempt — IP capture, integrity counters, sectional state, shuffle seed, adaptive
ALTER TABLE "OnlineExamAttempt"
  ADD COLUMN IF NOT EXISTS "ipAddress"            TEXT,
  ADD COLUMN IF NOT EXISTS "ipHistory"            TEXT NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS "fullscreenViolations" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "copyAttempts"         INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "sectionsLocked"       TEXT NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS "shuffleSeed"          INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "adaptiveTrail"        TEXT NOT NULL DEFAULT '[]';

-- 6) OnlineExamAppeal — re-grading flow
CREATE TABLE IF NOT EXISTS "OnlineExamAppeal" (
  "id"           TEXT PRIMARY KEY,
  "examId"       TEXT NOT NULL,
  "attemptId"    TEXT NOT NULL,
  "questionId"   TEXT NOT NULL,
  "studentId"    TEXT NOT NULL,
  "reason"       TEXT NOT NULL,
  "status"       TEXT NOT NULL DEFAULT 'OPEN',
  "resolvedById" TEXT,
  "resolution"   TEXT,
  "scoreDelta"   INTEGER NOT NULL DEFAULT 0,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt"   TIMESTAMP,
  CONSTRAINT "OnlineExamAppeal_examId_fkey"    FOREIGN KEY ("examId")    REFERENCES "OnlineExam"("id")        ON DELETE CASCADE,
  CONSTRAINT "OnlineExamAppeal_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "OnlineExamAttempt"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "OnlineExamAppeal_examId_status_idx" ON "OnlineExamAppeal"("examId","status");
CREATE INDEX IF NOT EXISTS "OnlineExamAppeal_studentId_idx"     ON "OnlineExamAppeal"("studentId");

-- 7) QuestionBankItem — make schoolId nullable for global qbank, add taxonomy + workflow
ALTER TABLE "QuestionBankItem"
  ALTER COLUMN "schoolId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "subtopic"         TEXT,
  ADD COLUMN IF NOT EXISTS "syllabus"         TEXT,
  ADD COLUMN IF NOT EXISTS "bloomLevel"       TEXT,
  ADD COLUMN IF NOT EXISTS "numericTolerance" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "numericRangeMin"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "numericRangeMax"  DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "rubric"           TEXT,
  ADD COLUMN IF NOT EXISTS "status"           TEXT NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN IF NOT EXISTS "reviewerId"       TEXT,
  ADD COLUMN IF NOT EXISTS "reviewedAt"       TIMESTAMP,
  ADD COLUMN IF NOT EXISTS "reviewNotes"      TEXT,
  ADD COLUMN IF NOT EXISTS "attemptCount"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "correctCount"     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "source"           TEXT NOT NULL DEFAULT 'INTERNAL';
CREATE INDEX IF NOT EXISTS "QuestionBankItem_schoolId_status_idx" ON "QuestionBankItem"("schoolId","status");
CREATE INDEX IF NOT EXISTS "QuestionBankItem_syllabus_difficulty_idx" ON "QuestionBankItem"("syllabus","difficulty");

-- 8) QuestionReview audit log
CREATE TABLE IF NOT EXISTS "QuestionReview" (
  "id"         TEXT PRIMARY KEY,
  "itemId"     TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "decision"   TEXT NOT NULL,
  "notes"      TEXT,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QuestionReview_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "QuestionBankItem"("id") ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "QuestionReview_itemId_idx" ON "QuestionReview"("itemId");

-- 9) ExamPattern — JEE/NEET preset templates
CREATE TABLE IF NOT EXISTS "ExamPattern" (
  "id"           TEXT PRIMARY KEY,
  "schoolId"     TEXT,
  "key"          TEXT NOT NULL UNIQUE,
  "name"         TEXT NOT NULL,
  "description"  TEXT,
  "durationMin"  INTEGER NOT NULL,
  "totalMarks"   INTEGER NOT NULL,
  "negativeMark" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "blueprint"    TEXT NOT NULL,
  "active"       BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ExamPattern_schoolId_active_idx" ON "ExamPattern"("schoolId","active");

-- 10) ExamBlueprint — per-tenant saved blueprint
CREATE TABLE IF NOT EXISTS "ExamBlueprint" (
  "id"          TEXT PRIMARY KEY,
  "schoolId"    TEXT NOT NULL,
  "examId"      TEXT UNIQUE,
  "name"        TEXT NOT NULL,
  "totalMarks"  INTEGER NOT NULL,
  "durationMin" INTEGER NOT NULL,
  "sections"    TEXT NOT NULL,
  "patternKey"  TEXT,
  "createdAt"   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "ExamBlueprint_schoolId_idx" ON "ExamBlueprint"("schoolId");

-- 11) SubscriptionPlan
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
  "id"            TEXT PRIMARY KEY,
  "key"           TEXT NOT NULL UNIQUE,
  "name"          TEXT NOT NULL,
  "pricePerMonth" INTEGER NOT NULL DEFAULT 0,
  "features"      TEXT NOT NULL DEFAULT '{}',
  "active"        BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12) OnlineAnswerLog — grading audit trail
CREATE TABLE IF NOT EXISTS "OnlineAnswerLog" (
  "id"           TEXT PRIMARY KEY,
  "attemptId"    TEXT NOT NULL,
  "questionId"   TEXT NOT NULL,
  "source"       TEXT NOT NULL,
  "marksAwarded" INTEGER NOT NULL,
  "feedback"     TEXT,
  "rubricJson"   TEXT,
  "createdAt"    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "OnlineAnswerLog_attemptId_idx" ON "OnlineAnswerLog"("attemptId");
CREATE INDEX IF NOT EXISTS "OnlineAnswerLog_questionId_idx" ON "OnlineAnswerLog"("questionId");

-- 13) OnlineExamInsight — predictive insights cache
CREATE TABLE IF NOT EXISTS "OnlineExamInsight" (
  "id"              TEXT PRIMARY KEY,
  "attemptId"       TEXT NOT NULL UNIQUE,
  "studentId"       TEXT NOT NULL,
  "examId"          TEXT NOT NULL,
  "topicMastery"    TEXT NOT NULL DEFAULT '[]',
  "weakTopics"      TEXT NOT NULL DEFAULT '[]',
  "recommendations" TEXT NOT NULL DEFAULT '[]',
  "predictedScore"  INTEGER NOT NULL DEFAULT 0,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "OnlineExamInsight_studentId_idx" ON "OnlineExamInsight"("studentId");
CREATE INDEX IF NOT EXISTS "OnlineExamInsight_examId_idx"    ON "OnlineExamInsight"("examId");

-- 14) OfflineSyncEntry — offline mode sync queue
CREATE TABLE IF NOT EXISTS "OfflineSyncEntry" (
  "id"         TEXT PRIMARY KEY,
  "schoolId"   TEXT NOT NULL,
  "studentId"  TEXT NOT NULL,
  "attemptId"  TEXT NOT NULL,
  "questionId" TEXT NOT NULL,
  "response"   TEXT NOT NULL,
  "clientTs"   TIMESTAMP NOT NULL,
  "receivedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "applied"    BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE UNIQUE INDEX IF NOT EXISTS "OfflineSyncEntry_attempt_q_ts_uq" ON "OfflineSyncEntry"("attemptId","questionId","clientTs");
CREATE INDEX IF NOT EXISTS "OfflineSyncEntry_schoolId_applied_idx"   ON "OfflineSyncEntry"("schoolId","applied");

-- 15) Seed the canonical subscription plans
INSERT INTO "SubscriptionPlan" ("id","key","name","pricePerMonth","features","active","createdAt")
VALUES
  ('plan_free',       'FREE',       'Free',         0,      '{"aiGeneration":false,"adaptiveTesting":false,"parentPortal":true,"analyticsDepth":"basic","whiteLabelPdf":false,"offlineMode":false,"attemptsPerMonth":50,"qbankSize":200}', TRUE, CURRENT_TIMESTAMP),
  ('plan_starter',    'STARTER',    'Starter',      499900, '{"aiGeneration":true,"adaptiveTesting":false,"parentPortal":true,"analyticsDepth":"basic","whiteLabelPdf":true,"offlineMode":false,"attemptsPerMonth":1000,"qbankSize":5000}', TRUE, CURRENT_TIMESTAMP),
  ('plan_pro',        'PRO',        'Pro',          1499900,'{"aiGeneration":true,"adaptiveTesting":true,"parentPortal":true,"analyticsDepth":"deep","whiteLabelPdf":true,"offlineMode":true,"attemptsPerMonth":10000,"qbankSize":50000}', TRUE, CURRENT_TIMESTAMP),
  ('plan_enterprise', 'ENTERPRISE', 'Enterprise',   4999900,'{"aiGeneration":true,"adaptiveTesting":true,"parentPortal":true,"analyticsDepth":"predictive","whiteLabelPdf":true,"offlineMode":true,"attemptsPerMonth":-1,"qbankSize":-1,"customDomain":true,"globalQbank":true}', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;

-- 16) Seed the canonical pattern presets (JEE Main / NEET UG)
INSERT INTO "ExamPattern" ("id","schoolId","key","name","description","durationMin","totalMarks","negativeMark","blueprint","active","createdAt")
VALUES
  ('pat_jee_main', NULL, 'JEE_MAIN', 'JEE Main', '3 sections (Phy/Chem/Math) · 30 Qs each (20 MCQ + 10 numeric) · +4 / -1', 180, 300, 1.0,
    '[{"name":"Physics","topic":null,"difficulty":"MIXED","count":30,"marksPerQ":4,"negativeMark":1,"sectional":true},{"name":"Chemistry","topic":null,"difficulty":"MIXED","count":30,"marksPerQ":4,"negativeMark":1,"sectional":true},{"name":"Mathematics","topic":null,"difficulty":"MIXED","count":30,"marksPerQ":4,"negativeMark":1,"sectional":true}]',
    TRUE, CURRENT_TIMESTAMP),
  ('pat_neet_ug',  NULL, 'NEET_UG',  'NEET UG',  '3 sections (Phy/Chem/Bio) · 45+45+90 Qs · +4 / -1', 200, 720, 1.0,
    '[{"name":"Physics","topic":null,"difficulty":"MIXED","count":45,"marksPerQ":4,"negativeMark":1,"sectional":false},{"name":"Chemistry","topic":null,"difficulty":"MIXED","count":45,"marksPerQ":4,"negativeMark":1,"sectional":false},{"name":"Biology","topic":null,"difficulty":"MIXED","count":90,"marksPerQ":4,"negativeMark":1,"sectional":false}]',
    TRUE, CURRENT_TIMESTAMP),
  ('pat_cbse_x',   NULL, 'CBSE_X',   'CBSE Class X Board (mock)', 'Single section · 80 marks · 3 hours · no negative', 180, 80, 0.0,
    '[{"name":"Section A — MCQ","topic":null,"difficulty":"EASY","count":20,"marksPerQ":1,"negativeMark":0,"sectional":false},{"name":"Section B — Short answer","topic":null,"difficulty":"MEDIUM","count":12,"marksPerQ":2,"negativeMark":0,"sectional":false},{"name":"Section C — Long answer","topic":null,"difficulty":"HARD","count":12,"marksPerQ":3,"negativeMark":0,"sectional":false}]',
    TRUE, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
