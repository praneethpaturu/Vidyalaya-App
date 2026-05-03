import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { requirePageRole } from "@/lib/auth";
import { prisma } from "@/lib/db";

async function completeIntake(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const transferId = String(form.get("transferId"));
  const t = await prisma.studentTransfer.findFirst({
    where: { id: transferId, toSchoolId: u.schoolId, status: "INITIATED" },
  });
  if (!t) return;

  const admissionNo = String(form.get("admissionNo") ?? "").trim();
  const rollNo = String(form.get("rollNo") ?? "").trim() || "0";
  const classId = String(form.get("classId") ?? "");
  const email = String(form.get("email") ?? "").trim();
  if (!admissionNo || !classId) return;
  if (await prisma.student.findFirst({ where: { schoolId: u.schoolId, admissionNo } })) {
    redirect(`/Home/SIS/transfer/inbox?error=admission-no-taken`);
  }

  // Pull source-side student details (from the originating branch's row).
  const source = await prisma.student.findUnique({
    where: { id: t.studentId },
    include: { user: true, guardians: { include: { guardian: { include: { user: true } } } } },
  });
  if (!source) return;

  const baseEmail = (email || `${admissionNo.toLowerCase()}@students.local`).toLowerCase();
  const password = await bcrypt.hash(admissionNo, 10);

  const newStudent = await prisma.$transaction(async (tx) => {
    const studentUser = await tx.user.create({
      data: {
        schoolId: u.schoolId,
        email: baseEmail,
        password,
        name: source.user.name,
        role: "STUDENT",
        active: true,
      },
    });
    const stu = await tx.student.create({
      data: {
        schoolId: u.schoolId,
        userId: studentUser.id,
        admissionNo, rollNo, classId,
        dob: source.dob,
        gender: source.gender,
        bloodGroup: source.bloodGroup,
        address: source.address,
      },
    });
    // Carry over guardians.
    for (const gs of source.guardians) {
      const g = gs.guardian;
      const gemail = `${stu.id}-${(g.relation ?? "guardian").toLowerCase()}@guardians.local`;
      const gu = await tx.user.create({
        data: {
          schoolId: u.schoolId,
          email: gemail,
          password,
          name: g.user.name,
          phone: g.user.phone,
          role: "PARENT",
          active: true,
        },
      });
      const guardian = await tx.guardian.create({
        data: { schoolId: u.schoolId, userId: gu.id, relation: g.relation ?? "Guardian" },
      });
      await tx.guardianStudent.create({
        data: { guardianId: guardian.id, studentId: stu.id, isPrimary: gs.isPrimary },
      }).catch(() => {});
    }
    await tx.studentTransfer.update({
      where: { id: t.id },
      data: { status: "COMPLETED", newStudentId: stu.id },
    });
    return stu;
  });

  revalidatePath("/Home/SIS/transfer/inbox");
  redirect(`/Home/SIS?completed=${newStudent.admissionNo}`);
}

async function reject(form: FormData) {
  "use server";
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const id = String(form.get("transferId"));
  await prisma.studentTransfer.updateMany({
    where: { id, toSchoolId: u.schoolId, status: "INITIATED" },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/Home/SIS/transfer/inbox");
}

export const dynamic = "force-dynamic";

export default async function TransferInboxPage({
  searchParams,
}: { searchParams: Promise<{ error?: string }> }) {
  const u = await requirePageRole(["ADMIN", "PRINCIPAL"]);
  const sp = await searchParams;
  const inbound = await prisma.studentTransfer.findMany({
    where: { toSchoolId: u.schoolId, status: "INITIATED" },
    orderBy: { effectiveAt: "desc" },
    take: 50,
  });
  const sourceStudents = await prisma.student.findMany({
    where: { id: { in: inbound.map((t) => t.studentId) } },
    include: { user: true, class: true, school: true },
  });
  const stuMap = new Map(sourceStudents.map((s) => [s.id, s]));

  const classes = await prisma.class.findMany({
    where: { schoolId: u.schoolId },
    orderBy: [{ grade: "asc" }, { section: "asc" }],
  });

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <Link href="/Home/SIS/transfer" className="text-xs text-brand-700 hover:underline">← Back to transfer</Link>
      <h1 className="h-page mt-1 mb-1">Inbound transfers</h1>
      <p className="muted mb-3">
        Students initiated as transfers from peer branches in your group. Complete intake to create
        the destination-side Student record (admission no, roll no, class), or reject the transfer.
      </p>

      {sp.error === "admission-no-taken" && (
        <div className="mb-4 rounded-lg bg-rose-50 text-rose-900 px-3 py-2 text-sm">
          That admission number is already taken — pick a different one.
        </div>
      )}

      {inbound.length === 0 ? (
        <div className="card card-pad text-center text-sm text-slate-500 py-12">
          No pending inbound transfers.
        </div>
      ) : (
        <div className="space-y-4">
          {inbound.map((t) => {
            const src = stuMap.get(t.studentId);
            return (
              <div key={t.id} className="card card-pad">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <div className="font-medium">{src?.user.name ?? "Student " + t.studentId.slice(-6)}</div>
                    <div className="text-xs text-slate-500">
                      From <span className="font-medium">{src?.school.name ?? t.fromSchoolId.slice(-6)}</span>
                      {src?.class?.name ? ` · was in ${src.class.name}` : ""}
                      {" · "}initiated {new Date(t.effectiveAt).toLocaleDateString("en-IN")}
                      {t.reason ? ` · ${t.reason}` : ""}
                    </div>
                  </div>
                  <span className="badge-amber">Pending intake</span>
                </div>

                <form action={completeIntake} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <input type="hidden" name="transferId" value={t.id} />
                  <div>
                    <label className="label">Admission no *</label>
                    <input required name="admissionNo" className="input" defaultValue={src?.admissionNo ?? ""} />
                  </div>
                  <div>
                    <label className="label">Roll no</label>
                    <input name="rollNo" className="input" defaultValue={src?.rollNo ?? ""} />
                  </div>
                  <div>
                    <label className="label">Class *</label>
                    <select required name="classId" className="input" defaultValue="">
                      <option value="">— Select —</option>
                      {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Login email</label>
                    <input type="email" name="email" className="input" placeholder="auto-generated if blank" />
                  </div>
                  <div className="md:col-span-4 flex justify-end gap-2">
                    <button
                      type="submit"
                      className="btn-primary"
                    >Complete intake</button>
                  </div>
                </form>

                <form action={reject} className="mt-2 flex justify-end">
                  <input type="hidden" name="transferId" value={t.id} />
                  <button className="text-xs text-rose-700 hover:underline" type="submit">Reject this transfer</button>
                </form>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
