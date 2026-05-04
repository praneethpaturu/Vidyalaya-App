import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = String(creds?.email ?? "").toLowerCase().trim();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
          include: { school: true },
        });
        // Block: missing, deactivated, OR soft-deleted users.
        if (!user || !user.active || user.deletedAt) return null;

        // Account locked? Reject without bumping the counter.
        if (user.lockedUntil && user.lockedUntil > new Date()) return null;

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) {
          // Atomic increment + conditional lock — two concurrent failed
          // attempts must not collide via read-then-write.
          const updated = await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: { increment: 1 } },
            select: { failedLoginAttempts: true },
          }).catch(() => null);
          const attempts = updated?.failedLoginAttempts ?? 0;
          if (attempts >= MAX_FAILED_ATTEMPTS) {
            await prisma.user.update({
              where: { id: user.id },
              data: { lockedUntil: new Date(Date.now() + LOCKOUT_MS) },
            }).catch(() => {});
          }
          return null;
        }

        // Success — reset counters, stamp last login.
        if (user.failedLoginAttempts > 0 || user.lockedUntil) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() },
          }).catch(() => {});
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }).catch(() => {});
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId ?? null,
          schoolName: user.school?.name ?? "Platform",
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        token.role = (user as any).role;
        token.schoolId = (user as any).schoolId;
        token.schoolName = (user as any).schoolName;
      }
      return token;
    },
    async session({ session, token }) {
      (session.user as any).id = token.id;
      (session.user as any).role = token.role;
      (session.user as any).schoolId = token.schoolId;
      (session.user as any).schoolName = token.schoolName;
      return session;
    },
  },
});

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  schoolId: string;
  schoolName: string;
};

export async function requireUser(): Promise<SessionUser> {
  const session = await auth();
  if (!session?.user) throw new Error("UNAUTHORIZED");
  return session.user as any as SessionUser;
}

export async function requireRole(roles: string[]): Promise<SessionUser> {
  const u = await requireUser();
  if (!roles.includes(u.role)) throw new Error("FORBIDDEN");
  return u;
}

// Page-level guard that uses Next.js redirect() for graceful UX:
//   * no session       → redirect to /login
//   * wrong role       → redirect to / (home — sidebar shows what's allowed)
// Use this in server components at the top of pages that should only be
// reachable by certain roles. API / server-action handlers should still
// use requireRole/requireUser (which throw — suitable for JSON responses).
export async function requirePageRole(roles: string[]): Promise<SessionUser> {
  const { redirect } = await import("next/navigation");
  const session = await auth();
  if (!session?.user) redirect("/login");
  // session is narrowed past the redirect, but TS doesn't infer that for
  // dynamically-imported never-returning helpers — use ! to assert.
  const u = session!.user as any as SessionUser;
  if (!roles.includes(u.role)) redirect("/");
  return u;
}
