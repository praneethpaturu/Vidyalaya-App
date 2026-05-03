import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function update(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const id = String(form.get("id"));
  const classId = String(form.get("classId"));
  const a = await prisma.assignment.findFirst({
    where: { id, class: { schoolId: u.schoolId } },
  });
  if (!a) return;
  await prisma.assignment.update({
    where: { id },
    data: {
      title: String(form.get("title") ?? a.title),
      description: String(form.get("description") ?? a.description),
      maxPoints: Number(form.get("maxPoints") ?? a.maxPoints),
      dueAt: form.get("dueAt") ? new Date(String(form.get("dueAt"))) : null,
      status: String(form.get("status") ?? a.status),
    },
  });
  revalidatePath(`/classes/${classId}/work/${id}`);
  redirect(`/classes/${classId}/work/${id}`);
}

async function deleteAssignment(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const id = String(form.get("id"));
  const classId = String(form.get("classId"));
  await prisma.assignment.deleteMany({
    where: { id, class: { schoolId: u.schoolId } },
  });
  revalidatePath(`/classes/${classId}/classwork`);
  redirect(`/classes/${classId}/classwork`);
}

export const dynamic = "force-dynamic";

export default async function EditAssignmentPage({ params }: { params: Promise<{ id: string; aid: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL", "TEACHER"]);
  const { id, aid } = await params;
  const a = await prisma.assignment.findFirst({
    where: { id: aid, class: { schoolId: u.schoolId } },
  });
  if (!a) notFound();

  return (
    <div className="p-5 max-w-2xl mx-auto">
      <Link href={`/classes/${id}/work/${aid}`} className="text-xs text-brand-700 hover:underline">← Back</Link>
      <h1 className="h-page mt-1 mb-3">Edit assignment</h1>
      <form action={deleteAssignment} id="del-form">
        <input type="hidden" name="id" value={aid} />
        <input type="hidden" name="classId" value={id} />
      </form>
      <form action={update} className="card card-pad space-y-3">
        <input type="hidden" name="id" value={aid} />
        <input type="hidden" name="classId" value={id} />
        <div>
          <label className="label">Title</label>
          <input required name="title" defaultValue={a.title} className="input" />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea name="description" rows={4} defaultValue={a.description} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Max points</label>
            <input type="number" min={1} name="maxPoints" defaultValue={a.maxPoints} className="input" />
          </div>
          <div>
            <label className="label">Due</label>
            <input type="datetime-local" name="dueAt" defaultValue={a.dueAt ? new Date(a.dueAt).toISOString().slice(0, 16) : ""} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Status</label>
          <select name="status" defaultValue={a.status} className="input">
            <option>DRAFT</option><option>PUBLISHED</option><option>ARCHIVED</option>
          </select>
        </div>
        <div className="flex justify-between gap-2 pt-2">
          <button type="submit" form="del-form" className="btn-outline text-rose-700">Delete</button>
          <button type="submit" className="btn-primary">Save changes</button>
        </div>
      </form>
    </div>
  );
}
