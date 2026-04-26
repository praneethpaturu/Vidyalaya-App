import { Users } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function AlumniPage() {
  return (
    <ModulePlaceholder
      title="Alumni Management"
      subtitle="Past-pupil network, events, mentorship and giving."
      icon={Users}
      status="ROADMAP"
      sections={[
        {
          label: "Directory",
          items: [
            "Batch-wise listing with current college / company",
            "Self-update portal",
            "Search by industry, city, batch",
          ],
        },
        {
          label: "Engagement",
          items: [
            "Reunions, talks, meet-the-junior sessions",
            "Mentorship matching with current students",
            "Newsletter & social channels",
          ],
        },
        {
          label: "Giving",
          items: [
            "Annual giving campaigns",
            "Class endowments",
            "Pledge & receipt automation",
          ],
        },
      ]}
    />
  );
}
