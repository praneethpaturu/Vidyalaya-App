"use client";
import Link from "next/link";
import { SubjectIllustration } from "./SubjectIllustration";
import { Video, Settings } from "lucide-react";
import { toast } from "sonner";

type Props = {
  title: string; subtitle?: string; theme: string; subjectHint?: string;
  classId: string; meetLink?: string | null;
};

export function ClassHeader({ title, subtitle, theme, subjectHint, classId, meetLink }: Props) {
  const link = meetLink ?? `https://meet.google.com/${classId.slice(-3)}-${classId.slice(-7, -4)}-${classId.slice(0, 3)}`;
  return (
    <div className={`theme-card theme-${theme} relative h-44 sm:h-52`}>
      <SubjectIllustration subject={subjectHint ?? title} />
      <div className="relative z-10 p-6 flex flex-col h-full">
        <div className="text-3xl font-medium text-slate-900 leading-tight">{title}</div>
        {subtitle && <div className="text-sm text-slate-700 mt-1">{subtitle}</div>}
        <div className="mt-auto flex gap-2">
          <a
            href={link} target="_blank" rel="noreferrer"
            onClick={() => { navigator.clipboard?.writeText(link); toast.success("Meet link copied to clipboard"); }}
            className="px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 text-sm flex items-center gap-1.5 backdrop-blur transition"
          >
            <Video className="w-4 h-4" /> Start Meet
          </a>
          <Link
            href={`/timetable/${classId}`}
            className="px-3 py-1.5 rounded-full bg-white/80 hover:bg-white text-slate-800 text-sm flex items-center gap-1.5 backdrop-blur transition"
          >
            <Settings className="w-4 h-4" /> Timetable
          </Link>
        </div>
      </div>
    </div>
  );
}
