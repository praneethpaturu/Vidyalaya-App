import Link from "next/link";
import { redirect } from "next/navigation";
import { createAnnouncement } from "@/app/actions/lms";

export default async function NewAnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  async function submit(fd: FormData) {
    "use server";
    await createAnnouncement(id, fd);
    redirect(`/classes/${id}`);
  }
  return (
    <div>
      <h2 className="h-section mb-3">New announcement</h2>
      <form action={submit} className="card card-pad space-y-3">
        <div>
          <label className="label">Title</label>
          <input className="input" name="title" required />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea className="input min-h-[140px]" name="body" required />
        </div>
        <div className="flex gap-2 justify-end">
          <Link href={`/classes/${id}`} className="btn-outline">Cancel</Link>
          <button className="btn-primary">Post</button>
        </div>
      </form>
    </div>
  );
}
