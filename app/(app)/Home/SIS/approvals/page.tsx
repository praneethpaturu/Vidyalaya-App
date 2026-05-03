import { redirect } from "next/navigation";

export default function SISApprovalsPage() {
  // SIS approvals = admission/doc-edit/TC. Surface in unified queue (filter via UI).
  redirect("/Home/Approvals");
}
