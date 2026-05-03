import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function record(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const title = String(form.get("title") ?? "").trim();
  if (!title) return;
  await prisma.achievement.create({
    data: {
      schoolId: u.schoolId,
      title,
      description: String(form.get("description") ?? "") || null,
      category: String(form.get("category") ?? "OTHER"),
      level: String(form.get("level") ?? "") || null,
      position: String(form.get("position") ?? "") || null,
      studentId: (String(form.get("studentId") ?? "") || null) as any,
      staffId: (String(form.get("staffId") ?? "") || null) as any,
      awardedAt: new Date(String(form.get("awardedAt") ?? new Date().toISOString())),
      certificateUrl: String(form.get("certificateUrl") ?? "") || null,
    },
  });
  revalidatePath("/Achievements");
  redirect("/Achievements");
}

export const dynamic = "force-dynamic";

export default async function NewAchievementPage() {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const [students, staff] = await Promise.all([
    prisma.student.findMany({
      where: { schoolId: u.schoolId, deletedAt: null },
      include: { user: true, class: true },
      orderBy: { admissionNo: "asc" },
      take: 1000,
    }),
    prisma.staff.findMany({
      where: { schoolId: u.schoolId, deletedAt: null as any },
      include: { user: true },
      orderBy: { user: { name: "asc" } },
      take: 1000,
    }),
  ]);

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <h1 className="h-page mb-3">Record achievement</h1>
      <form action={record} className="card card-pad space-y-3">
        <div>
          <label className="label">Title *</label>
          <input required name="title" className="input" placeholder="National Math Olympiad — Gold" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Category</label>
            <select name="category" className="input" defaultValue="ACADEMIC">
              <option>ACADEMIC</option><option>SPORTS</option><option>CULTURAL</option><option>OTHER</option>
            </select>
          </div>
          <div>
            <label className="label">Level</label>
            <select name="level" className="input" defaultValue="">
              <option value="">—</option>
              <option>SCHOOL</option><option>DISTRICT</option><option>STATE</option>
              <option>NATIONAL</option><option>INTERNATIONAL</option>
            </select>
          </div>
          <div>
            <label className="label">Position</label>
            <input name="position" className="input" placeholder="1st / Gold / Finalist" />
          </div>
          <div>
            <label className="label">Awarded on *</label>
            <input required type="date" name="awardedAt" className="input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Student</label>
            <select name="studentId" className="input" defaultValue="">
              <option value="">— None —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.admissionNo} · {s.user.name} · {s.class?.name ?? "—"}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Staff</label>
            <select name="staffId" className="input" defaultValue="">
              <option value="">— None —</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.user.name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" className="input" rows={3} />
        </div>
        <div>
          <label className="label">Certificate URL (optional)</label>
          <input name="certificateUrl" className="input" placeholder="https://…" />
        </div>
        <div className="flex justify-end gap-2">
          <a href="/Achievements" className="btn-outline">Cancel</a>
          <button type="submit" className="btn-primary">Record</button>
        </div>
      </form>
    </div>
  );
}
