import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createAssignment } from "@/app/actions/lms";

export default async function NewAssignmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const subjects = await prisma.subject.findMany({ where: { classId: id }, orderBy: { name: "asc" } });

  async function submit(fd: FormData) {
    "use server";
    const aid = await createAssignment(id, fd);
    redirect(`/classes/${id}/work/${aid}`);
  }

  return (
    <div>
      <h2 className="h-section mb-3">Create assignment</h2>
      <form action={submit} className="card card-pad space-y-3">
        <div>
          <label className="label">Title</label>
          <input className="input" name="title" required placeholder="e.g. Quadratic equations practice" />
        </div>
        <div>
          <label className="label">Instructions</label>
          <textarea className="input min-h-[140px]" name="description" required />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="label">Subject</label>
            <select className="input" name="subjectId">
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Points</label>
            <input className="input" name="maxPoints" type="number" defaultValue={100} min={0} />
          </div>
          <div>
            <label className="label">Due date</label>
            <input className="input" name="dueAt" type="datetime-local" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Link href={`/classes/${id}/classwork`} className="btn-outline">Cancel</Link>
          <button className="btn-primary">Assign</button>
        </div>
      </form>
    </div>
  );
}
