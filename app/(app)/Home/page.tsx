import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fmtDate, inr } from "@/lib/utils";
import {
  Users, GraduationCap, Bus, BookOpen, Boxes, AlertCircle, Phone, Mail,
  MessageSquare, Crown, ChevronRight, LogIn, Building2,
} from "lucide-react";
import HomePageTabs from "@/components/HomePageTabs";

// MCB Home dashboard — section 3 of the PRD.
// Tabs (Dashboard / Students M-o-M / Room Allocations / Email Notifications / Email / Classes in progress)
// are implemented as the dark sub-nav (see SubNav). This is the Dashboard tab.

export default async function HomeMcbPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "ACCOUNTANT", "HR_MANAGER", "TRANSPORT_MANAGER", "INVENTORY_MANAGER"]);
  const user = u;
  const sId = user.schoolId;

  // Bypass admin's role-aware tile in the legacy / page; this is the MCB top-tier dashboard.
  const [
    students, allCount, cbseCount, staffCount, newJoinees, teachingStaff, nonTeaching,
    inventoryItems, inventoryCategories,
    concerns7d, concernsToday, concerns30d,
    smsCredits, voiceCredits, waCredits,
    neverLogged, loginsToday,
  ] = await Promise.all([
    prisma.student.count({ where: { schoolId: sId } }),
    prisma.student.count({ where: { schoolId: sId } }),
    prisma.student.count({ where: { schoolId: sId } }), // CBSE only — single-board demo
    prisma.staff.count({ where: { schoolId: sId } }),
    prisma.staff.count({ where: { schoolId: sId, joiningDate: { gte: new Date(Date.now() - 30 * 86400000) } } }),
    prisma.staff.count({ where: { schoolId: sId, designation: { contains: "Teacher" } } }),
    prisma.staff.count({ where: { schoolId: sId, NOT: { designation: { contains: "Teacher" } } } }),
    prisma.inventoryItem.count({ where: { schoolId: sId } }),
    prisma.inventoryItem.findMany({ where: { schoolId: sId }, distinct: ["category"], select: { category: true } }),
    prisma.concern.count({ where: { schoolId: sId, createdAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    prisma.concern.count({ where: { schoolId: sId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    prisma.concern.count({ where: { schoolId: sId, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } } }),
    prisma.connectProvider.findFirst({ where: { schoolId: sId, channel: "SMS" } }),
    prisma.connectProvider.findFirst({ where: { schoolId: sId, channel: "VOICE" } }),
    prisma.connectProvider.findFirst({ where: { schoolId: sId, channel: "WHATSAPP" } }),
    prisma.user.count({ where: { schoolId: sId, NOT: { id: { in: (await prisma.loginEvent.findMany({ where: { schoolId: sId }, select: { userId: true }, distinct: ["userId"] })).map((l) => l.userId) } } } }),
    prisma.loginEvent.count({ where: { schoolId: sId, loggedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
  ]);

  const branches = 1; // demo school is single-branch

  return (
    <div className="p-5 max-w-screen-2xl mx-auto">
      <HomePageTabs />
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 font-display">Welcome back</h1>
          <p className="text-sm text-slate-500 mt-1">{user.schoolName} · Academic year 2026–2027</p>
        </div>
      </div>

      {/* Top KPI tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-5">
        {/* Strength counter */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Users className="w-4 h-4" />
              </span>
              Strength
            </div>
            <Link href="/Home/SIS" className="text-xs text-brand-700 hover:text-brand-800 flex items-center gap-0.5 font-medium">
              Data checker <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div>
              <div className="text-[11px] text-slate-500">All</div>
              <div className="text-3xl font-semibold tracking-tight text-slate-900">{allCount}</div>
            </div>
            <div className="pl-4">
              <div className="text-[11px] text-slate-500">CBSE</div>
              <div className="text-3xl font-semibold tracking-tight text-slate-900">{cbseCount}</div>
            </div>
          </div>
        </div>

        {/* Staff card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Crown className="w-4 h-4 text-violet-700" /> Staff
            </div>
            <Link href="/Home/HR" className="text-xs text-brand-700 hover:underline flex items-center gap-0.5">
              Hierarchy <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center">
            <Stat label="New Joinees" value={newJoinees} />
            <Stat label="Teaching" value={teachingStaff} />
            <Stat label="Non-Teaching" value={nonTeaching} />
            <Stat label="Total" value={staffCount} />
          </div>
        </div>

        {/* Communications */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-700" /> Communications
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center mb-2">
            <CommBlock label="SMS" credits={smsCredits?.credits ?? 0} icon={MessageSquare} />
            <CommBlock label="Voice" credits={voiceCredits?.credits ?? 0} icon={Phone} />
            <CommBlock label="WhatsApp" credits={waCredits?.credits ?? 0} icon={Phone} />
            <CommBlock label="Email" credits={9999} icon={Mail} />
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px] mt-1">
            <Link href="/Connect/SMS" className="badge-slate">Sender ID</Link>
            <Link href="/Connect/SMS" className="badge-slate">SMS Credits</Link>
            <Link href="/Connect/SMS" className="badge-slate">Recharge</Link>
            <Link href="/Connect/SMS" className="badge-slate">Usage</Link>
            <Link href="/Connect/SMS" className="badge-slate">Know DLT</Link>
          </div>
        </div>

        {/* Board-wise Branches */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-700" /> Board-wise Branches
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div>
              <div className="text-[11px] text-slate-500">CBSE</div>
              <div className="text-3xl font-medium">{branches}</div>
            </div>
            <div className="pl-4">
              <div className="text-[11px] text-slate-500">Total branches</div>
              <div className="text-3xl font-medium">{branches}</div>
            </div>
          </div>
        </div>

        {/* Concerns */}
        <ConcernsCard today={concernsToday} d7={concerns7d} d30={concerns30d} />

        {/* Inventory */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-amber-700" /> Inventory
            </div>
            <Link href="/inventory" className="text-xs text-brand-700 hover:underline flex items-center gap-0.5">
              Open <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-1 text-center">
            <Stat label="Items" value={inventoryItems} />
            <Stat label="Category" value={inventoryCategories.length} />
            <Stat label="Sub-Cat" value={0} />
            <Stat label="Type" value={1} />
          </div>
        </div>

        {/* Login Status */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 hover:shadow-md transition-shadow duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <LogIn className="w-4 h-4 text-rose-700" /> Login Status
            </div>
            <Link href="/LoginStats" className="text-xs text-brand-700 hover:underline flex items-center gap-0.5">
              Never Logged-in <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 divide-x divide-slate-100">
            <div>
              <div className="text-[11px] text-slate-500">Today</div>
              <div className="text-3xl font-medium">{loginsToday}</div>
            </div>
            <div className="pl-4">
              <div className="text-[11px] text-slate-500">Never logged in</div>
              <div className="text-3xl font-medium">{neverLogged}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick links into the major modules */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
        <QuickLink href="/Home/SIS"           icon={Users}            label="SIS" tone="blue" />
        <QuickLink href="/Home/HR"            icon={Crown}            label="HR" tone="violet" />
        <QuickLink href="/Home/Finance"       icon={BookOpen}         label="Finance" tone="amber" />
        <QuickLink href="/Home/Admissions"    icon={GraduationCap}    label="Admissions" tone="emerald" />
        <QuickLink href="/Home/Transport"     icon={Bus}              label="Transport" tone="rose" />
        <QuickLink href="/Home/Library"       icon={BookOpen}         label="Library" tone="sky" />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className="text-2xl font-medium tracking-tight">{value}</div>
    </div>
  );
}

function CommBlock({ label, credits, icon: Icon }: { label: string; credits: number; icon: any }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2">
      <div className="flex items-center justify-center mb-0.5">
        <Icon className="w-3.5 h-3.5 text-slate-600" />
      </div>
      <div className="text-[10px] text-slate-500">{label}</div>
      <div className="text-sm font-medium">{credits.toLocaleString()}</div>
    </div>
  );
}

function ConcernsCard({ today, d7, d30 }: { today: number; d7: number; d30: number }) {
  return (
    <div className="card card-pad">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" /> Concerns
        </div>
        <Link href="/Concerns" className="text-xs text-brand-700 hover:underline">Open</Link>
      </div>
      <div className="grid grid-cols-3 divide-x divide-slate-100 text-center">
        <Stat label="Today" value={today} />
        <div className="pl-3"><Stat label="Last 7 days" value={d7} /></div>
        <div className="pl-3"><Stat label="Last 30 days" value={d30} /></div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, label, tone }: { href: string; icon: any; label: string; tone: string }) {
  const tones: Record<string, string> = {
    blue: "bg-brand-50 text-brand-700 hover:bg-brand-100",
    violet: "bg-violet-50 text-violet-700 hover:bg-violet-100",
    amber: "bg-amber-50 text-amber-700 hover:bg-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    rose: "bg-rose-50 text-rose-700 hover:bg-rose-100",
    sky: "bg-sky-50 text-sky-700 hover:bg-sky-100",
  };
  return (
    <Link href={href} className={`flex flex-col items-center px-3 py-4 rounded-2xl border border-slate-200 transition ${tones[tone]}`}>
      <Icon className="w-6 h-6 mb-1.5" />
      <div className="text-sm font-medium">{label}</div>
    </Link>
  );
}
