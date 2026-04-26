import { ScrollText } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function ICSEGradebookPage() {
  return (
    <ModulePlaceholder
      title="ICSE Gradebook"
      subtitle="Indian School Certificate — ICSE (Class X) and ISC (Class XII)."
      icon={ScrollText}
      status="ROADMAP"
      sections={[
        {
          label: "ICSE (X)",
          items: [
            "Internal & external marks split (50/50, 80/20)",
            "Group-1 / Group-2 / Group-3 subjects",
            "Best-five aggregate calculator",
          ],
        },
        {
          label: "ISC (XII)",
          items: [
            "Project & practical evaluation",
            "Compulsory subject + 4 electives matrix",
            "Pre-board, board & internal weighting",
          ],
        },
      ]}
    />
  );
}
