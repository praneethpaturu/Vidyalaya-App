import { ScrollText } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function CambridgeGradebookPage() {
  return (
    <ModulePlaceholder
      title="Cambridge Gradebook"
      subtitle="Cambridge Primary, Lower Secondary, IGCSE, AS / A Level."
      icon={ScrollText}
      status="ROADMAP"
      sections={[
        {
          label: "Primary & Lower Secondary",
          items: [
            "Checkpoint readiness reports",
            "Strand-level mastery tracking",
            "Learning objective coverage",
          ],
        },
        {
          label: "IGCSE",
          items: [
            "Paper-wise marks entry (multiple components)",
            "Coursework / practical & written ratios",
            "Conversion to grade A* – G",
          ],
        },
        {
          label: "AS / A Level",
          items: [
            "Predicted grades from past papers",
            "AS → A2 carry-forward",
            "UCAS reference workflow",
          ],
        },
      ]}
    />
  );
}
