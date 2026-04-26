import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./db";

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
        if (!user || !user.active) return null;
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          schoolId: user.schoolId,
          schoolName: user.school.name,
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
