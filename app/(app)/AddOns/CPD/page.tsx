import { GraduationCap } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function CPDPage() {
  return (
    <ModulePlaceholder
      title="CPD — Continuous Professional Development"
      subtitle="Training calendar, attendance, certification and CPD-hour tracking."
      icon={GraduationCap}
      status="ROADMAP"
      sections={[
        {
          label: "Programmes",
          items: [
            "Internal workshops & external sessions",
            "Catalogue with prerequisites & outcomes",
            "Mandatory vs elective tagging",
          ],
        },
        {
          label: "Tracking",
          items: [
            "Per-staff CPD-hour ledger",
            "Certificates & evidence uploads",
            "Annual CPD compliance report",
          ],
        },
        {
          label: "Linkage",
          items: [
            "PMS goals tied to CPD plans",
            "Subject-mastery refreshers",
            "Mentorship & lesson observation cycles",
          ],
        },
      ]}
    />
  );
}
