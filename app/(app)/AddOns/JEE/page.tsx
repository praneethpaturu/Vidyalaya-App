import { ScrollText } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function JEEPage() {
  return (
    <ModulePlaceholder
      title="JEE Mains Add-on"
      subtitle="Targeted prep tracker for senior students — mock tests, percentile and analysis."
      icon={ScrollText}
      status="ROADMAP"
      sections={[
        {
          label: "Test cycles",
          items: [
            "Weekly chapter tests + monthly full-syllabus mocks",
            "Subject-wise time logs (Phy / Chem / Math)",
            "Computer-based test simulation",
          ],
        },
        {
          label: "Analytics",
          items: [
            "Percentile prediction & rank trend",
            "Strength / weakness heatmap by chapter",
            "Speed vs accuracy curves",
          ],
        },
        {
          label: "Mentorship",
          items: [
            "Subject-mentor weekly reviews",
            "Doubt-resolution queue",
            "Counseling calendar (parent + child)",
          ],
        },
      ]}
    />
  );
}
