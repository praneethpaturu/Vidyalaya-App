-- Add deletedAt nullable column on the four "people" models. Soft-delete
-- pattern: setting deletedAt to a timestamp logically deletes the row
-- without losing history (audit logs, payments, attendance keep referring
-- to the user). Existing User.active flag continues to gate sign-in;
-- deletedAt records WHEN the soft-delete happened.
ALTER TABLE "User"     ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Student"  ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Staff"    ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "Guardian" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- Indexes — most queries that filter on deletedAt also filter on schoolId,
-- so a partial index keyed on (schoolId, deletedAt IS NULL) is the cheapest.
-- For now use simple indexes; switch to partial when we have row counts
-- that warrant it.
CREATE INDEX "User_deletedAt_idx"     ON "User"     ("deletedAt");
CREATE INDEX "Student_deletedAt_idx"  ON "Student"  ("deletedAt");
CREATE INDEX "Staff_deletedAt_idx"    ON "Staff"    ("deletedAt");
CREATE INDEX "Guardian_deletedAt_idx" ON "Guardian" ("deletedAt");
