import { redirect } from "next/navigation";

export default function JEEAddOnPage() {
  // JEE prep maps onto OnlineExams + AI Question Bank in our app.
  redirect("/Home/Online_Exams");
}
