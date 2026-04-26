import { ScrollText } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function ECAGradebookPage() {
  return (
    <ModulePlaceholder
      title="ECA &amp; PET Gradebook"
      subtitle="Co-curricular: clubs, sports, arts, life-skills, physical education tests."
      icon={ScrollText}
      status="ROADMAP"
      sections={[
        {
          label: "Clubs & Activities",
          items: [
            "Per-student enrolment & attendance",
            "Project / showcase rubrics",
            "Mentor-led reflection notes",
          ],
        },
        {
          label: "Sports",
          items: [
            "Team rosters, fixtures, scoring",
            "Skill grading (technique, fitness, attitude)",
            "Achievement & national-level entries",
          ],
        },
        {
          label: "PET (Physical Efficiency Tests)",
          items: [
            "Norm-referenced fitness battery",
            "Weight, height, BMI, endurance, flexibility",
            "Term-on-term progress charts",
          ],
        },
      ]}
    />
  );
}
