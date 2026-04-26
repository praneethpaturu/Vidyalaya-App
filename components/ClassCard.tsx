import Link from "next/link";
import { SubjectIllustration } from "./SubjectIllustration";

type Props = {
  href: string;
  title: string;
  section?: string;
  teacher?: string;
  studentCount?: number;
  subjectHint?: string;
  theme: string;
};

export function ClassCard({ href, title, section, teacher, studentCount, subjectHint, theme }: Props) {
  return (
    <Link href={href} className={`theme-card theme-${theme} block group`}>
      <div className="relative h-44 sm:h-48">
        <SubjectIllustration subject={subjectHint ?? title} />
        <div className="relative p-5 z-10 flex flex-col h-full">
          <div className="text-2xl font-medium text-slate-900 leading-tight">{title}</div>
          {section && <div className="text-sm text-slate-700/80 mt-1">{section}</div>}
          <div className="mt-auto flex items-center justify-between pt-4">
            <div className="text-sm text-slate-700">
              {teacher ? teacher : `${studentCount ?? ""} students`}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
