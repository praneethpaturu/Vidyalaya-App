import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { fmtDate, initials, inr } from "@/lib/utils";
import { ScrollText, FileText, Award, IdCard } from "lucide-react";

export default async function StudentProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stu = await prisma.student.findUnique({
    where: { id },
    include: {
      user: true, class: true, busStop: { include: { route: true } },
      guardians: { include: { guardian: { include: { user: true } } } },
      invoices: true,
      classAttendance: { take: 30, orderBy: { date: "desc" } },
    },
  });
  if (!stu) notFound();
  const presentDays = stu.classAttendance.filter((a) => a.status === "PRESENT").length;
  const totalDays = stu.classAttendance.length;
  const pct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
  const balance = stu.invoices.reduce((s, i) => s + (i.total - i.amountPaid), 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="card overflow-hidden mb-6">
        <div className="p-6 bg-gradient-to-br from-brand-50 to-brand-100/40 border-b border-slate-100 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-600 text-white grid place-items-center text-xl font-medium">
            {initials(stu.user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-medium">{stu.user.name}</h1>
            <p className="muted">{stu.class?.name ?? "—"} · Roll {stu.rollNo} · Adm {stu.admissionNo}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          <Cell k="DOB" v={fmtDate(stu.dob)} />
          <Cell k="Gender" v={stu.gender} />
          <Cell k="Blood" v={stu.bloodGroup ?? "—"} />
          <Cell k="Bus" v={stu.busStop?.name ?? "—"} sub={stu.busStop?.route?.name} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Tile label="Attendance (30 days)" value={`${pct}%`} accent="blue" />
        <Tile label="Pending fees" value={inr(balance)} accent={balance > 0 ? "amber" : "green"} />
        <Tile label="Guardians" value={stu.guardians.length} />
      </div>

      <div className="card mb-6">
        <div className="p-4 border-b border-slate-100"><h2 className="h-section">Address & contacts</h2></div>
        <div className="p-4 space-y-1 text-sm">
          <div><span className="text-slate-500">Address:</span> {stu.address}</div>
          {stu.guardians.map((g) => (
            <div key={g.id}><span className="text-slate-500">{g.guardian.relation}:</span> <strong>{g.guardian.user.name}</strong> · {g.guardian.user.phone ?? g.guardian.user.email}</div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="p-4 border-b border-slate-100"><h2 className="h-section">Certificates & documents</h2></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
          <CertCard href={`/api/students/${stu.id}/cert/bonafide`} label="Bonafide Certificate" icon={Award} color="emerald" />
          <CertCard href={`/api/students/${stu.id}/cert/character`} label="Character Certificate" icon={ScrollText} color="violet" />
          <CertCard href={`/api/students/${stu.id}/cert/transfer`} label="Transfer Certificate" icon={FileText} color="amber" />
          <CertCard href={`/api/students/${stu.id}/cert/id-card`} label="Student ID Card" icon={IdCard} color="brand" />
        </div>
      </div>
    </div>
  );
}

function Cell({ k, v, sub }: any) {
  return <div className="p-4"><div className="text-xs text-slate-500">{k}</div><div className="text-sm font-medium mt-1">{v}</div>{sub && <div className="text-xs text-slate-500">{sub}</div>}</div>;
}
function Tile({ label, value, accent }: any) {
  const t = accent === "amber" ? "text-amber-700" : accent === "green" ? "text-emerald-700" : accent === "blue" ? "text-brand-700" : "text-slate-900";
  return <div className="card card-pad"><div className="text-xs text-slate-500">{label}</div><div className={`kpi-num mt-1 ${t}`}>{value}</div></div>;
}
function CertCard({ href, label, icon: Icon, color }: any) {
  const map: Record<string, string> = { emerald: "bg-emerald-50 text-emerald-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-700", brand: "bg-brand-50 text-brand-700" };
  return (
    <a href={href} target="_blank"
      className="rounded-xl border border-slate-200 p-4 hover:shadow-card transition flex flex-col items-center text-center gap-2">
      <div className={`w-10 h-10 rounded-xl grid place-items-center ${map[color]}`}><Icon className="w-5 h-5" /></div>
      <div className="text-sm font-medium">{label}</div>
      <div className="text-xs text-brand-700">Download PDF</div>
    </a>
  );
}
