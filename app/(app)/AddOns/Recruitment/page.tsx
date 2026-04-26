import { Briefcase } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function RecruitmentPage() {
  return (
    <ModulePlaceholder
      title="Recruitment"
      subtitle="Job openings → applicants → interviews → offers → onboarding."
      icon={Briefcase}
      status="ROADMAP"
      sections={[
        {
          label: "Sourcing",
          items: [
            "Open positions with JD templates",
            "Public careers page",
            "Referral tracking",
          ],
        },
        {
          label: "Pipeline",
          items: [
            "Resume parsing (see AI Insights → Resume Parser)",
            "Interview scheduling + scorecards",
            "Reference checks",
          ],
        },
        {
          label: "Onboarding",
          items: [
            "Offer letter generation",
            "Document checklist & verification",
            "Day-1 handover to HR",
          ],
        },
      ]}
    />
  );
}
