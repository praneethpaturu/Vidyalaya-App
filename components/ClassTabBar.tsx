"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageSquare, ClipboardList, Users, BookOpen } from "lucide-react";

export function ClassTabBar({ classId }: { classId: string }) {
  const pathname = usePathname();
  const isActive = (sub: string) =>
    sub === "" ? pathname === `/classes/${classId}` : pathname.startsWith(`/classes/${classId}/${sub}`);

  const tabs = [
    { sub: "",         label: "Stream",    icon: MessageSquare },
    { sub: "classwork", label: "Classwork", icon: ClipboardList },
    { sub: "people",   label: "People",    icon: Users },
    { sub: "gradebook", label: "Gradebook", icon: BookOpen },
  ];

  return (
    <div className="sticky bottom-0 lg:static lg:mt-2 bg-white border-t border-slate-200 lg:border lg:border-slate-200 lg:rounded-2xl lg:shadow-card">
      <div className="tabbar">
        {tabs.map((t) => {
          const active = isActive(t.sub);
          return (
            <Link
              key={t.sub}
              href={`/classes/${classId}${t.sub ? "/" + t.sub : ""}`}
              className={active ? "active" : ""}
            >
              <span className="tab-pill flex items-center gap-2">
                <t.icon className="w-5 h-5" />
                <span className="hidden sm:inline">{t.label}</span>
              </span>
              <span className="sm:hidden text-[11px]">{t.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
