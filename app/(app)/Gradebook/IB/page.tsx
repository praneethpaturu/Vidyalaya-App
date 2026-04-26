import { ScrollText } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function IBGradebookPage() {
  return (
    <ModulePlaceholder
      title="IB Gradebook"
      subtitle="International Baccalaureate (PYP / MYP / DP) — criterion-referenced assessment."
      icon={ScrollText}
      status="ROADMAP"
      sections={[
        {
          label: "PYP",
          items: [
            "Learner-profile attributes",
            "Programme of Inquiry (POI) units",
            "Subject-strand evidence",
            "Anecdotal narrative reports",
          ],
        },
        {
          label: "MYP",
          items: [
            "Subject-group rubrics (A–D criteria)",
            "Personal Project tracking",
            "Service as Action log",
            "Achievement level conversions",
          ],
        },
        {
          label: "DP",
          items: [
            "Internal assessments & predicted grades",
            "TOK essay + presentation",
            "Extended Essay supervisor sign-off",
            "CAS hours & reflections",
          ],
        },
      ]}
    />
  );
}
