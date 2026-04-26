import { HeartPulse } from "lucide-react";
import ModulePlaceholder from "@/components/ModulePlaceholder";

export default function InfirmaryPage() {
  return (
    <ModulePlaceholder
      title="Infirmary"
      subtitle="School clinic — student visits, medication, allergies, immunisations."
      icon={HeartPulse}
      status="ROADMAP"
      sections={[
        {
          label: "Student health profile",
          items: [
            "Allergies & chronic conditions",
            "Immunisation record",
            "Emergency contacts & doctor",
          ],
        },
        {
          label: "Visits",
          items: [
            "Symptoms, vitals, prescription, follow-up",
            "Auto-notify parent on visit",
            "Send-home / hospital-referral workflow",
          ],
        },
        {
          label: "Medication",
          items: [
            "Daily medication schedule",
            "Stock & expiry of sick-bay supplies",
            "First-aid kit audit",
          ],
        },
      ]}
    />
  );
}
