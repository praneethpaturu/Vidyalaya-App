-- Houses / Clubs / Sports groups + multi-membership.

CREATE TABLE "StudentGroup" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'CLUB',
  "color" TEXT NOT NULL DEFAULT 'blue',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentGroup_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "StudentGroup_schoolId_name_key" ON "StudentGroup"("schoolId","name");
CREATE INDEX "StudentGroup_schoolId_active_idx" ON "StudentGroup"("schoolId","active");

CREATE TABLE "StudentGroupMember" (
  "id" TEXT NOT NULL,
  "groupId" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "role" TEXT,
  "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StudentGroupMember_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StudentGroupMember_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "StudentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "StudentGroupMember_groupId_studentId_key" ON "StudentGroupMember"("groupId","studentId");

CREATE TABLE "SchoolSetting" (
  "id" TEXT NOT NULL,
  "schoolId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "value" TEXT NOT NULL DEFAULT '{}',
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "updatedBy" TEXT,
  CONSTRAINT "SchoolSetting_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SchoolSetting_schoolId_key_key" ON "SchoolSetting"("schoolId","key");
CREATE INDEX "SchoolSetting_schoolId_idx" ON "SchoolSetting"("schoolId");
