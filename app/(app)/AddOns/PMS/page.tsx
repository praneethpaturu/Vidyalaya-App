import { Trophy } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function PMSPage() {
  return (
    <ModulePlaceholder
      title="PMS — Performance Management"
      subtitle="Staff goal-setting, mid-year & annual reviews, KRAs and KPIs."
      icon={Trophy}
      status="ROADMAP"
      sections={[
        {
          label: "Goals",
          items: [
            "Cascade school-level goals to teams & individuals",
            "SMART goal templates",
            "Mid-year check-ins with manager comments",
          ],
        },
        {
          label: "Reviews",
          items: [
            "360° feedback (peer + manager + self)",
            "Competency frameworks (teacher / non-teaching)",
            "Calibration meetings",
          ],
        },
        {
          label: "Outcomes",
          items: [
            "Increment & promotion recommendations",
            "Development plans (link to CPD)",
            "Performance improvement plans",
          ],
        },
      ]}
    />
  );
}
