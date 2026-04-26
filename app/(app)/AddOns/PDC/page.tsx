import { Receipt } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function PDCPage() {
  return (
    <ModulePlaceholder
      title="PDC Management"
      subtitle="Post-dated cheques — bank-deposit calendar, tracking and reminders."
      icon={Receipt}
      status="ROADMAP"
      sections={[
        {
          label: "Register",
          items: [
            "Cheque entry: drawer, bank, due date, amount",
            "Linked to invoice / fee head",
            "Scanned image attachment",
          ],
        },
        {
          label: "Banking",
          items: [
            "Daily deposit slip generator",
            "Auto-reminder T-3 days before deposit",
            "Bounce & replacement workflow",
          ],
        },
        {
          label: "Reports",
          items: [
            "Pending PDCs by month",
            "Bounced cheques register",
            "Outstanding by drawer",
          ],
        },
      ]}
    />
  );
}
