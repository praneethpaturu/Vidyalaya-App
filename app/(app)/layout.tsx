import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Shell from "@/components/Shell";
import { brandFor, brandStyleBlock } from "@/lib/branding";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const u = session.user as any;
  // Refresh the school name fresh from DB so a rename takes effect immediately
  // (without requiring users to sign out / sign back in).
  let schoolName: string = u.schoolName;
  let hiddenModules: string[] = [];
  if (u.schoolId) {
    const [s, hidden] = await Promise.all([
      prisma.school.findUnique({ where: { id: u.schoolId }, select: { name: true } }),
      prisma.menuVisibility.findMany({
        where: { schoolId: u.schoolId, role: u.role, visible: false },
        select: { moduleKey: true },
      }),
    ]);
    if (s?.name) schoolName = s.name;
    hiddenModules = hidden.map((h) => h.moduleKey);
  }
  // BRD §4.4 — white-label brand colour: emit a :root override so every
  // primary button / accent on the tenant inherits it without rebuilds.
  const brand = await brandFor(u.schoolId);
  const styleBlock = brandStyleBlock(brand);
  return (
    <>
      {styleBlock && <style dangerouslySetInnerHTML={{ __html: styleBlock }} />}
      <Shell
        user={{ name: u.name, email: u.email, role: u.role, schoolName }}
        hiddenModules={hiddenModules}
      >
        {children}
      </Shell>
    </>
  );
}
