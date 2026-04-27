"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { useState } from "react";
import {
  LogOut, Settings, Lock, KeyRound, Smartphone, Fingerprint, GraduationCap,
} from "lucide-react";
import { ROLE_LABEL } from "@/lib/nav";
import Avatar from "@/components/ui/Avatar";
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
    <div className="min-h-screen bg-slate-50/60 text-slate-900">
      <CommandPalette />
      <ToastFromSearchParams />

      {/* Header — sticky, white, soft underline */}
      <header
        className="sticky top-0 z-20 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-slate-200"
        role="banner"
      >
        <div className="max-w-screen-2xl mx-auto px-4 pt-2.5 pb-1.5">
          <div className="flex items-start gap-4">
            {/* Brand: Vidyalaya wordmark + customer school name */}
            <Link
              href="/Home"
              className="flex items-start gap-3 shrink-0 group rounded-md focus-visible:outline-none focus-visible:shadow-focus"
              aria-label={`Home — ${user.schoolName}`}
            >
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-brand-700 to-brand-900 text-white flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-[1.02]">
                <GraduationCap className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="min-w-0 max-w-[300px]">
                <div className="text-[18px] font-semibold tracking-tight text-slate-900 leading-snug truncate font-display">
                  {user.schoolName}
                </div>
                <div className="text-[10px] text-slate-500 -mt-0.5 tracking-wide">
                  Vidyalaya · School Suite
                </div>
              </div>
            </Link>

            {/* Module dropdowns */}
            <div className="flex-1 min-w-0 hidden lg:flex items-end pb-0.5">
              <ModuleHeaderNav />
            </div>

            {/* Right utility cluster */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 bg-slate-100 rounded-full p-1 ring-1 ring-slate-200">
                <WhatsNewButton />
                <FavouritesMenu />
                <HelpMenu />
              </div>
              <YearPill defaultYear="2026-2027" />
              <SearchPopover />
              <AppLauncher />
              <NotificationBell />

              {/* Profile menu */}
              <div className="relative ml-1">
                <button
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-haspopup="menu"
                  aria-expanded={profileOpen}
                  aria-label="Open profile menu"
                  className="flex flex-col items-center rounded-full transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:shadow-focus"
                >
                  <Avatar name={user.name} size="md" />
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {user.role === "ADMIN" ? "Admin" : user.name.split(" ")[0]}
                  </span>
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setProfileOpen(false)} aria-hidden="true" />
                    <div
                      role="menu"
                      aria-label="Profile menu"
                      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-40 p-3 animate-in"
                    >
                      <div className="flex items-center gap-3 mb-3 pb-3 border-b border-slate-100">
                        <Avatar name={user.name} size="lg" />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-slate-900 truncate">{user.name}</div>
                          <div className="text-xs text-slate-500 truncate">{user.email}</div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {ROLE_LABEL[user.role] ?? user.role} · {user.schoolName}
                          </div>
                        </div>
                      </div>
                      <ProfileLink href="/profile"     icon={Lock}        label="Security Settings" />
                      <ProfileLink href="/Settings"    icon={Settings}    label="Settings" />
                      <ProfileLink href="/profile"     icon={KeyRound}    label="Change Password" />
                      <ProfileLink href="/MobileApps"  icon={Smartphone}  label="Mobile App Logins" />
                      <ProfileLink href="#bio"         icon={Fingerprint} label="Biometric / RFID" />
                      <div className="border-t border-slate-100 my-2" />
                      <a
                        href="#book-am"
                        className="block w-full text-center py-2 rounded-lg bg-brand-50 text-brand-700 text-xs font-medium hover:bg-brand-100 transition-colors"
                        role="menuitem"
                      >
                        Book a slot · Account Manager
                      </a>
                      <a
                        href="#book-csm"
                        className="block w-full text-center py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors mt-1.5"
                        role="menuitem"
                      >
                        Book a slot · Customer Success
                      </a>
                      <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-2 text-sm py-2 px-2 rounded-lg hover:bg-slate-100 text-slate-700 mt-2 transition-colors"
                        role="menuitem"
                      >
                        <LogOut className="w-4 h-4" aria-hidden="true" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <BreadcrumbBar />

      <main className="min-w-0" role="main">{children}</main>
    </div>
  );
}

function ProfileLink({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 transition-colors"
      role="menuitem"
    >
      <Icon className="w-4 h-4 text-slate-500" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}
