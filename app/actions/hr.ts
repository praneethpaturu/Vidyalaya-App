"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { notify, templates } from "@/lib/notify";
import { fmtDate } from "@/lib/utils";

export async function applyLeave(formData: FormData) {
  const session = await auth();
  const user = session!.user as any;
  const staff = await prisma.staff.findUnique({ where: { userId: user.id } });
  if (!staff) throw new Error("Not staff");

  const type = String(formData.get("type"));
  const halfDay = formData.get("halfDay") === "true";
  const fromDate = new Date(String(formData.get("fromDate")));
  const toDate = new Date(String(formData.get("toDate")));
  const reason = String(formData.get("reason") ?? "");
  const days = halfDay ? 0.5 : Math.max(1, Math.round((toDate.getTime() - fromDate.getTime()) / 86400000) + 1);

  const lr = await prisma.leaveRequest.create({
    data: {
      staffId: staff.id, type, halfDay, fromDate, toDate, days, reason,
      status: "PENDING",
    },
  });
  await audit("APPLY_LEAVE", {
    entity: "LeaveRequest", entityId: lr.id,
    summary: `Applied ${type} leave for ${days} day${days > 1 ? "s" : ""} (${fmtDate(fromDate)} → ${fmtDate(toDate)})`,
    meta: { type, days, halfDay },
  });
  // Notify HR/principal — find the school's HR managers
  const approvers = await prisma.user.findMany({ where: { schoolId: user.schoolId, role: { in: ["HR_MANAGER","PRINCIPAL","ADMIN"] } } });
  for (const a of approvers) {
    await notify({
      schoolId: user.schoolId, channel: "INAPP", toUserId: a.id,
      subject: "New leave request", body: `${user.name} requested ${type} leave for ${days} day${days > 1 ? "s" : ""} starting ${fmtDate(fromDate)}.`,
    });
  }
  revalidatePath("/hr/leave");
}

export async function decideLeave(id: string, decision: "APPROVED" | "REJECTED", _formData: FormData) {
  const session = await auth();
  const user = session!.user as any;
  const approver = await prisma.staff.findUnique({ where: { userId: user.id } });
  const lr = await prisma.leaveRequest.findUnique({ where: { id }, include: { staff: { include: { user: true } } } });
  if (!lr) return;
  await prisma.leaveRequest.update({
    where: { id },
    data: { status: decision, approverId: approver?.id, decidedAt: new Date() },
  });
  if (decision === "APPROVED") {
    const year = new Date().getFullYear();
    const bal = await prisma.leaveBalance.findUnique({ where: { staffId_year_type: { staffId: lr.staffId, year, type: lr.type } } }).catch(() => null);
    if (bal) await prisma.leaveBalance.update({ where: { id: bal.id }, data: { used: bal.used + lr.days } });
  }
  await audit(decision === "APPROVED" ? "APPROVE_LEAVE" : "REJECT_LEAVE", {
    entity: "LeaveRequest", entityId: id,
    summary: `${decision} ${lr.type} leave for ${lr.staff.user.name} (${lr.days} day${lr.days > 1 ? "s" : ""})`,
  });
  const tpl = templates.leaveDecided(lr.staff.user.name, decision, fmtDate(lr.fromDate), fmtDate(lr.toDate));
  await notify({ schoolId: user.schoolId, channel: "EMAIL", toEmail: lr.staff.user.email, ...tpl, template: "LEAVE_DECIDED" });
  await notify({ schoolId: user.schoolId, channel: "INAPP", toUserId: lr.staff.userId, ...tpl, template: "LEAVE_DECIDED" });
  revalidatePath("/hr/leave");
}

export async function fileCompliance(id: string, _fd: FormData) {
  const session = await auth();
  const user = session!.user as any;
  const cp = await prisma.compliancePeriod.findUnique({ where: { id } });
  if (!cp) return;
  const ref = `${cp.type}-${cp.year}${String(cp.month).padStart(2,"0")}-${Math.floor(Math.random()*999999)}`;
  await prisma.compliancePeriod.update({
    where: { id },
    data: { status: "FILED", filedAt: new Date(), challanRef: ref },
  });
  await audit("FILE_COMPLIANCE", {
    entity: "CompliancePeriod", entityId: id,
    summary: `Filed ${cp.type} for ${cp.month}/${cp.year} — ref ${ref}`,
    meta: { type: cp.type, amount: cp.amount, ref },
  });
  revalidatePath("/hr/compliance");
}
