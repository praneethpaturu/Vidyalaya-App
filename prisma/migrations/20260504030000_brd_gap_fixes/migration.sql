-- BRD gap-fix migration:
--   1. Backfill existing QuestionBankItem rows to PUBLISHED so blueprint
--      generator + existing question import flows continue to work after
--      we introduced the DRAFT/REVIEW/PUBLISHED workflow.
--   2. Make User.schoolId nullable so a PLATFORM_ADMIN row can exist
--      without belonging to any tenant.
--   3. Backfill OnlineExamAttempt.status defaults that may have stayed
--      NOT_STARTED for legacy demo rows.

-- 1) Backfill qbank PUBLISHED for legacy rows.
UPDATE "QuestionBankItem"
SET "status" = 'PUBLISHED'
WHERE "status" = 'DRAFT' AND "active" = TRUE;

-- 2) User.schoolId nullable for cross-tenant Platform Admin.
ALTER TABLE "User" ALTER COLUMN "schoolId" DROP NOT NULL;
-- AuthToken needs the same so password-reset works for platform admins.
ALTER TABLE "AuthToken" ALTER COLUMN "schoolId" DROP NOT NULL;

-- 3) Reset adaptiveTrail/sectionsLocked text defaults on any legacy
--    NULL rows that may have skipped the prior migration.
UPDATE "OnlineExamAttempt" SET "adaptiveTrail" = '[]' WHERE "adaptiveTrail" IS NULL;
UPDATE "OnlineExamAttempt" SET "sectionsLocked" = '{}' WHERE "sectionsLocked" IS NULL;
UPDATE "OnlineExamAttempt" SET "ipHistory"      = '[]' WHERE "ipHistory" IS NULL;
