-- Phase 2: question media + descriptive answer attachments + rate limiting

-- 1) OnlineQuestion media
ALTER TABLE "OnlineQuestion"
  ADD COLUMN IF NOT EXISTS "imageUrl"    TEXT,
  ADD COLUMN IF NOT EXISTS "attachments" TEXT NOT NULL DEFAULT '[]';

-- 2) QuestionBankItem media (mirrors OnlineQuestion so blueprint copies them)
ALTER TABLE "QuestionBankItem"
  ADD COLUMN IF NOT EXISTS "imageUrl"    TEXT,
  ADD COLUMN IF NOT EXISTS "attachments" TEXT NOT NULL DEFAULT '[]';

-- 3) RateLimitBucket already exists from migration 20260428034524 with
-- fields (id, count, resetAt). We reuse it for AI endpoint throttling
-- via lib/rate-limit.
