// UDISE+ (Unified District Information System for Education+) — the
// mandatory annual data report Indian schools file with the Ministry of
// Education. The real schema has 200+ fields. We surface a builder that
// composes the report from existing Prisma data.

import { prisma } from "@/lib/db";

export type UDISEPayload = {
  schoolId: string;
  academicYear: string;
  // Sections (each maps to a tab in the official UDISE+ Excel)
  basic: { name: string; udiseCode?: string; managementType: string; medium: string };
  enrolment: {
    classWise: { grade: string; boys: number; girls: number; total: number }[];
    totalStudents: number;
  };
  staff: {
    teaching: number;
    nonTeaching: number;
    byQualification: { degree: string; count: number }[];
  };
  facilities: {
    classrooms: number;
    library: boolean;
    playground: boolean;
    drinkingWater: boolean;
    toiletsBoys: number;
    toiletsGirls: number;
  };
  finance: {
    feesCollectedPaise: number;
    grantsReceivedPaise: number;
    expenditurePaise: number;
  };
};

export async function buildUDISEReport(schoolId: string, academicYear: string): Promise<UDISEPayload> {
  const sch = await prisma.school.findUnique({ where: { id: schoolId } });
  const students = await prisma.student.findMany({
    where: { schoolId },
    include: { class: true },
  });

  // Enrolment by grade + gender
  const grades = new Map<string, { boys: number; girls: number }>();
  for (const s of students) {
    const g = s.class?.grade ?? "Unknown";
    const cur = grades.get(g) ?? { boys: 0, girls: 0 };
    if (s.gender === "M") cur.boys++; else cur.girls++;
    grades.set(g, cur);
  }
  const classWise = [...grades.entries()].map(([grade, v]) => ({
    grade, boys: v.boys, girls: v.girls, total: v.boys + v.girls,
  })).sort((a, b) => a.grade.localeCompare(b.grade, undefined, { numeric: true }));

  const staffCount = await prisma.staff.count({ where: { schoolId } });
  const teaching = await prisma.staff.count({
    where: { schoolId, designation: { contains: "Teacher" } },
  });
  const totalCollected = await prisma.payment.aggregate({
    where: { schoolId, status: "SUCCESS" },
    _sum: { amount: true },
  });

  return {
    schoolId,
    academicYear,
    basic: {
      name: sch?.name ?? "Unknown",
      udiseCode: undefined,           // populated when school has registered
      managementType: "Pvt Unaided",  // or "Govt", "Govt Aided"
      medium: "English",
    },
    enrolment: {
      classWise,
      totalStudents: students.length,
    },
    staff: {
      teaching,
      nonTeaching: staffCount - teaching,
      byQualification: [],            // would query StaffDoc
    },
    facilities: {
      classrooms: (await prisma.class.count({ where: { schoolId } })),
      library: true, playground: true, drinkingWater: true,
      toiletsBoys: 4, toiletsGirls: 4,
    },
    finance: {
      feesCollectedPaise: Number(totalCollected._sum.amount ?? 0),
      grantsReceivedPaise: 0,
      expenditurePaise: 0,
    },
  };
}
