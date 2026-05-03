import { redirect } from "next/navigation";

export default function FinanceApprovalsPage() {
  redirect("/Home/Approvals?kind=FEE_WAIVER");
}
