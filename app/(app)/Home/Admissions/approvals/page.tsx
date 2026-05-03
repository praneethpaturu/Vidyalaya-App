import { redirect } from "next/navigation";

export default function AdmissionApprovalsPage() {
  redirect("/Home/Approvals?kind=ADMISSION");
}
