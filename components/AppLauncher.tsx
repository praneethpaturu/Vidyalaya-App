"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Grip, X } from "lucide-react";
import { MODULES, MODULE_GROUP_LABEL, type ModuleGroup } from "@/lib/modules";

const GROUP_ORDER: ModuleGroup[] = [
  "ERP", "FINANCE", "HR", "GRADEBOOK", "LMS", "CONNECT", "ADD_ONS", "SETTINGS",
];

// Curated allow-lists for non-admin roles. Anything outside the allow-list
// is hidden from the App Launcher for that role. Admin-class roles (ADMIN,
// PRINCIPAL, ACCOUNTANT, HR_MANAGER, TRANSPORT_MANAGER, INVENTORY_MANAGER,
// TEACHER) keep the full launcher.
const PARENT_ALLOWED = new Set([
  "/", "/fees", "/transport", "/announcements", "/events",
  "/timetable", "/attendance", "/exams", "/library", "/profile",
]);
const STUDENT_ALLOWED = new Set([
  "/", "/classes", "/timetable", "/exams", "/library",
  "/announcements", "/events", "/transport", "/fees", "/profile",
]);

export default function AppLauncher({ role }: { role?: string } = {}) {
  const [open, setOpen] = useState(false);
  const allow =
    role === "PARENT"  ? PARENT_ALLOWED  :
    role === "STUDENT" ? STUDENT_ALLOWED :
    null; // null = no filter (admin-class)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="App launcher"
        aria-label="App launcher"
        className="inline-flex items-center justify-center w-9 h-9 rounded-md hover:bg-slate-100 text-slate-700"
      >
        <Grip className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center" role="dialog">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="relative mt-16 mx-4 w-full max-w-5xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Grip className="w-5 h-5 text-brand-700" />
                <div className="font-medium">App launcher</div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 max-h-[75vh] overflow-y-auto">
              {GROUP_ORDER.map((g) => {
                const items = MODULES
                  .filter((m) => m.group === g)
                  .filter((m) => !allow || allow.has(m.href));
                if (items.length === 0) return null;
                return (
                  <div key={g} className="mb-6">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                      {MODULE_GROUP_LABEL[g]}
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {items.map((m) => (
                        <Link
                          key={`${g}-${m.href}-${m.label}`}
                          href={m.href}
                          onClick={() => setOpen(false)}
                          className="flex flex-col items-center text-center px-2 py-3 rounded-xl hover:bg-slate-50 transition"
                        >
                          <div className="w-11 h-11 rounded-xl bg-brand-50 text-brand-700 flex items-center justify-center mb-1.5">
                            <m.icon className="w-5 h-5" />
                          </div>
                          <div className="text-xs text-slate-700 leading-tight line-clamp-2">
                            {m.label}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
