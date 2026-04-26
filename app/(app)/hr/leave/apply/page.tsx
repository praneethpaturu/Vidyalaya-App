import Link from "next/link";
import { redirect } from "next/navigation";
import { applyLeave } from "@/app/actions/hr";

export default function ApplyLeavePage() {
  async function submit(fd: FormData) {
    "use server";
    await applyLeave(fd);
    redirect("/hr/leave");
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="h-page mb-4">Apply for leave</h1>
      <form action={submit} className="card card-pad space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Leave type</label>
            <select className="input" name="type">
              <option value="CL">Casual Leave (CL)</option>
              <option value="SL">Sick Leave (SL)</option>
              <option value="EL">Earned Leave (EL)</option>
              <option value="COMP_OFF">Comp-off</option>
              <option value="LOP">Loss of Pay</option>
            </select>
          </div>
          <div>
            <label className="label">Half day?</label>
            <select className="input" name="halfDay">
              <option value="false">No</option>
              <option value="true">Yes</option>
            </select>
          </div>
          <div>
            <label className="label">From date</label>
            <input type="date" name="fromDate" className="input" required />
          </div>
          <div>
            <label className="label">To date</label>
            <input type="date" name="toDate" className="input" required />
          </div>
        </div>
        <div>
          <label className="label">Reason</label>
          <textarea name="reason" className="input min-h-[100px]" required />
        </div>
        <div className="flex gap-2 justify-end">
          <Link href="/hr/leave" className="btn-outline">Cancel</Link>
          <button className="btn-primary">Submit request</button>
        </div>
      </form>
    </div>
  );
}
