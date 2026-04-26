import { ScrollText } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function PreSchoolGradebookPage() {
  return (
    <ModulePlaceholder
      title="Pre-School Gradebook"
      subtitle="Foundational stage (NEP 2020) — play-based, narrative observations only."
      icon={ScrollText}
      status="ROADMAP"
      sections={[
        {
          label: "Domains",
          items: [
            "Physical / motor development",
            "Socio-emotional & ethical",
            "Cognitive (numeracy, problem solving)",
            "Language & literacy",
            "Aesthetic & cultural",
          ],
        },
        {
          label: "Evidence",
          items: [
            "Photo & video portfolio per child",
            "Anecdotal observation log",
            "Parent-teacher conversation notes",
          ],
        },
        {
          label: "Reporting",
          items: [
            "Termly narrative HPC card",
            "No grades / marks (NEP-aligned)",
            "Strengths-first language templates",
          ],
        },
      ]}
    />
  );
}
