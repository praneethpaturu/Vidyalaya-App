-- Adaptive testing scope: questions served on-demand are tagged with
-- the requesting attemptId so they don't leak into the teacher's exam
-- view or pollute item analysis.
ALTER TABLE "OnlineQuestion" ADD COLUMN IF NOT EXISTS "attemptScope" TEXT;
CREATE INDEX IF NOT EXISTS "OnlineQuestion_attemptScope_idx" ON "OnlineQuestion"("attemptScope");
