"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LogOut, Settings, Lock, KeyRound, Smartphone, Fingerprint,
} from "lucide-react";
import { ROLE_LABEL } from "@/lib/nav";
import { initials } from "@/lib/utils";
import NotificationBell from "./NotificationBell";
import CommandPalette from "./CommandPalette";
import ToastFromSearchParams from "./ToastFromSearchParams";
import AppLauncher from "./AppLauncher";
import HelpMenu from "./HelpMenu";
import YearPill from "./YearPill";
import WhatsNewButton from "./WhatsNewButton";
import FavouritesMenu from "./FavouritesMenu";
import SearchPopover from "./SearchPopover";
import BreadcrumbBar from "./BreadcrumbBar";
import ModuleHeaderNav from "./ModuleHeaderNav";

type Props = {
  children: React.ReactNode;
  user: { name: string; email: string; role: string; schoolName: string };
};

export default function Shell({ children, user }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <CommandPalette />
      <ToastFromSearchParams />

      {/* Top header — white, two-row layout matching MCB. Row 1 = brand + utilities. Row 2 = module dropdowns. */}
      <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
        <div className="max-w-screen-2xl mx-auto px-4 pt-2 pb-1.5">
          <div className="flex items-start gap-4">
            {/* School crest + name (linked to Home) */}
            <Link href="/Home" className="flex items-start gap-3 shrink-0">
              <div className="relative w-14 h-14 rounded-md flex items-center justify-center shrink-0">
                {/* Crest-style logo: deep-blue shield with white "LAKSHYA" text */}
                <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full">
                  <defs>
                    <linearGradient id="crestG" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#1d4ed8" />
                      <stop offset="1" stopColor="#0f2d5e" />
                    </linearGradient>
                  </defs>
                  <path d="M8 6 h40 v32 c0 9 -8 14 -20 18 c-12 -4 -20 -9 -20 -18 z" fill="url(#crestG)" />
                  <path d="M8 6 h40 v32 c0 9 -8 14 -20 18 c-12 -4 -20 -9 -20 -18 z" fill="none" stroke="#facc15" strokeWidth="1.5" />
                  <text x="28" y="32" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="700" fontFamily="ui-sans-serif">LAKSHYA</text>
                  <circle cx="28" cy="18" r="3" fill="#facc15" />
                </svg>
              </div>
              <div className="min-w-0 max-w-[300px]">
                <div className="text-[18px] font-semibold tracking-tight text-mcb-orange leading-snug truncate">
                  {user.schoolName}
                </div>
                <div className="text-[10px] text-slate-500 -mt-0.5">MyClassBoard</div>
              </div>
            </Link>

            {/* Module dropdowns (separate row alignment via flex-1) */}
            <div className="flex-1 min-w-0 hidden lg:flex items-end pb-0.5">
              <ModuleHeaderNav />
            </div>

            {/* Right utility cluster */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-800 rounded-full p-1">
                <WhatsNewButton />
                <FavouritesMenu />
                <HelpMenu />
              </div>
              <YearPill defaultYear="2026-2027" />
              <SearchPopover />
              <AppLauncher />
              <NotificationBell />
              <div className="relative ml-1">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  className="flex flex-col items-center"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-[11px] font-semibold ring-1 ring-slate-200 overflow-hidden">
                    {initials(user.name)}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {user.role === "ADMIN" ? "SysAdmin" : user.name.split(" ")[0]}
                  </span>
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-lg z-40 p-3">
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                        <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center text-base font-medium">
                          {initials(user.name)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium truncate">{user.name}</div>
                          <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {ROLE_LABEL[user.role] ?? user.role} · {user.schoolName}
                          </div>
                        </div>
                      </div>
                      <ProfileLink href="/profile" icon={Lock} label="Security Settings" />
                      <ProfileLink href="/Settings" icon={Settings} label="Settings" />
                      <ProfileLink href="/profile" icon={KeyRound} label="Change Password" />
                      <ProfileLink href="/MobileApps" icon={Smartphone} label="Mobile App Logins" />
                      <ProfileLink href="#bio" icon={Fingerprint} label="Biometric / RFID / VTS / PG" />
                      <div className="border-t border-slate-100 my-2" />
                      <a
                        href="#book-am"
                        className="block w-full text-center py-1.5 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100"
                      >
                        Book a Slot · Account Manager
                      </a>
                      <a
                        href="#book-csm"
                        className="block w-full text-center py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 mt-1.5"
                      >
                        Book a Slot · Customer Success
                      </a>
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-2 text-sm py-2 px-2 rounded-lg hover:bg-slate-100 text-slate-700 mt-2"
                      >
                        <LogOut className="w-4 h-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Dark breadcrumb strip */}
      <BreadcrumbBar />

      {/* Main */}
      <main className="min-w-0">{children}</main>
    </div>
  );
}

function ProfileLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700"
    >
      <Icon className="w-4 h-4 text-slate-500" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
