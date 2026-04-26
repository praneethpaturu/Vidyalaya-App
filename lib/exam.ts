// CBSE-style grade scale (default). Schools can customise easily.
// Out of 100 (or scaled).

export type GradeRule = { min: number; grade: string; remark: string };

export const CBSE_GRADES: GradeRule[] = [
  { min: 91, grade: "A1", remark: "Outstanding" },
  { min: 81, grade: "A2", remark: "Excellent" },
  { min: 71, grade: "B1", remark: "Very Good" },
  { min: 61, grade: "B2", remark: "Good" },
  { min: 51, grade: "C1", remark: "Above Average" },
  { min: 41, grade: "C2", remark: "Average" },
  { min: 33, grade: "D",  remark: "Pass" },
  { min: 0,  grade: "E",  remark: "Needs Improvement" },
];

export function gradeFor(percent: number, scale: GradeRule[] = CBSE_GRADES): GradeRule {
  for (const r of scale) if (percent >= r.min) return r;
  return scale[scale.length - 1];
}

export function pctOf(obtained: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((obtained / max) * 100 * 10) / 10;
}

export type ReportCardSubject = {
  subjectName: string;
  maxMarks: number;
  marksObtained: number;
  percent: number;
  grade: string;
  remark: string;
  absent: boolean;
};

export type ReportCard = {
  studentName: string;
  admissionNo: string;
  rollNo: string;
  className: string;
  examName: string;
  examType: string;
  subjects: ReportCardSubject[];
  totalObtained: number;
  totalMax: number;
  percent: number;
  overallGrade: string;
  overallRemark: string;
  rank?: number;
  classSize?: number;
  passed: boolean;
};

export function buildReportCard(args: {
  studentName: string; admissionNo: string; rollNo: string; className: string;
  examName: string; examType: string;
  subjects: { subjectName: string; maxMarks: number; marksObtained: number; absent: boolean }[];
  passingPct: number;
  rank?: number; classSize?: number;
}): ReportCard {
  const enriched: ReportCardSubject[] = args.subjects.map((s) => {
    const pct = s.absent ? 0 : pctOf(s.marksObtained, s.maxMarks);
    const g = gradeFor(pct);
    return {
      subjectName: s.subjectName, maxMarks: s.maxMarks,
      marksObtained: s.marksObtained, absent: s.absent,
      percent: pct, grade: s.absent ? "AB" : g.grade, remark: s.absent ? "Absent" : g.remark,
    };
  });
  const totalObtained = enriched.reduce((s, x) => s + x.marksObtained, 0);
  const totalMax = enriched.reduce((s, x) => s + x.maxMarks, 0);
  const percent = pctOf(totalObtained, totalMax);
  const overall = gradeFor(percent);
  const passed = percent >= args.passingPct && enriched.every((s) => s.absent || s.percent >= args.passingPct);

  return {
    studentName: args.studentName, admissionNo: args.admissionNo, rollNo: args.rollNo, className: args.className,
    examName: args.examName, examType: args.examType,
    subjects: enriched,
    totalObtained, totalMax, percent,
    overallGrade: overall.grade, overallRemark: overall.remark,
    rank: args.rank, classSize: args.classSize, passed,
  };
}

// Compute ranks across a class for a given exam: returns map studentId → rank
export function computeRanks(scoreByStudent: Map<string, number>): Map<string, number> {
  const sorted = Array.from(scoreByStudent.entries()).sort((a, b) => b[1] - a[1]);
  const ranks = new Map<string, number>();
  let lastScore = -1; let lastRank = 0; let i = 0;
  for (const [sid, score] of sorted) {
    i++;
    if (score !== lastScore) { lastRank = i; lastScore = score; }
    ranks.set(sid, lastRank);
  }
  return ranks;
}
