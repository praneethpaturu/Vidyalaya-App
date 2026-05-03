-- Multi-AY model, zonal layer, master subject taxonomy, store hierarchy, manage-menus.

CREATE TABLE "AcademicYear" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "startsOn" TIMESTAMP(3) NOT NULL,
  "endsOn" TIMESTAMP(3) NOT NULL,
  "isCurrent" BOOLEAN NOT NULL DEFAULT false,
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "AcademicYear_schoolId_name_key" ON "AcademicYear"("schoolId","name");
CREATE INDEX "AcademicYear_schoolId_isCurrent_idx" ON "AcademicYear"("schoolId","isCurrent");

-- Backfill: one AcademicYear per school using the existing School.academicYear value.
INSERT INTO "AcademicYear" ("id","schoolId","name","startsOn","endsOn","isCurrent")
SELECT
  'cay_' || substr(md5(random()::text || s."id"),1,16),
  s."id",
  s."academicYear",
  to_date(split_part(s."academicYear",'-',1)||'-04-01','YYYY-MM-DD'),
  to_date(split_part(s."academicYear",'-',2)||'-03-31','YYYY-MM-DD'),
  true
FROM "School" s
WHERE NOT EXISTS (SELECT 1 FROM "AcademicYear" ay WHERE ay."schoolId"=s."id");

CREATE TABLE "OrgGroup" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "hqCity" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrgGroup_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Zone" (
  "id" TEXT NOT NULL,
  "groupId" TEXT,
  "name" TEXT NOT NULL,
  "region" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Zone_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Zone_groupId_idx" ON "Zone"("groupId");

ALTER TABLE "School" ADD COLUMN "zoneId" TEXT;
ALTER TABLE "School" ADD COLUMN "groupId" TEXT;

CREATE TABLE "MasterSubject" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'CORE',
  "curriculum" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MasterSubject_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MasterSubject_code_key" ON "MasterSubject"("code");

CREATE TABLE "StoreCategory" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "parentId" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreCategory_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StoreCategory_schoolId_name_parentId_key" ON "StoreCategory"("schoolId","name","parentId");
CREATE INDEX "StoreCategory_schoolId_parentId_idx" ON "StoreCategory"("schoolId","parentId");

CREATE TABLE "MenuVisibility" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "moduleKey" TEXT NOT NULL,
  "visible" BOOLEAN NOT NULL DEFAULT true,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MenuVisibility_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MenuVisibility_schoolId_role_moduleKey_key" ON "MenuVisibility"("schoolId","role","moduleKey");
CREATE INDEX "MenuVisibility_schoolId_role_idx" ON "MenuVisibility"("schoolId","role");
