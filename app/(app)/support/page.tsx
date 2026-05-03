import Link from "next/link";
import { Ticket, Calendar, Users, MessageSquare, Video, BookOpen } from "lucide-react";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

const TILES = [
  { href: "/Concerns/new",        icon: Ticket,        title: "Raise a ticket",                desc: "School-internal concerns / IT / infra issues with SLA tracking." },
  { href: "/support/training",    icon: Calendar,      title: "Book training",                  desc: "Schedule a session with our Account Manager or your CSM." },
  { href: "/support/training",    icon: Video,         title: "View scheduled trainings",       desc: "Upcoming + past trainings booked for your school." },
  { href: "/support/contacts",    icon: Users,         title: "School points of contact",       desc: "Your customer success manager, billing, technical lead." },
  { href: "/support/feedback",    icon: MessageSquare, title: "Give feedback",                  desc: "Tell us what to build next. 30-second form." },
  { href: "/support/help",        icon: BookOpen,      title: "Help videos",                    desc: "Tutorial library — see how every module works." },
];

export const dynamic = "force-dynamic";

export default async function SupportHubPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TEACHER", "PARENT", "STUDENT", "TRANSPORT_MANAGER", "INVENTORY_MANAGER"]);
  const counts = await prisma.supportRequest.groupBy({
    by: ["type", "status"],
    where: { schoolId: u.schoolId },
    _count: { _all: true },
  });
  const open = (t: string) => counts.filter((c) => c.type === t && c.status === "OPEN").reduce((s, c) => s + c._count._all, 0);

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="h-page mb-1">Help &amp; resources</h1>
      <p className="muted mb-4">Everything from raising a support ticket to booking training with your CSM.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TILES.map((t) => (
          <Link key={t.title} href={t.href}
            className="card card-pad hover:shadow-cardHover transition flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-700 grid place-items-center shrink-0">
              <t.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="font-medium">{t.title}</div>
              <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
              {t.title.includes("training") && open("TRAINING_AM") + open("CSM_MEETING") > 0 && (
                <div className="text-[11px] text-amber-700 mt-1">
                  {open("TRAINING_AM") + open("CSM_MEETING")} pending booking{open("TRAINING_AM") + open("CSM_MEETING") !== 1 ? "s" : ""}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
