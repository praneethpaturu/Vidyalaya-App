import { auth } from "@/lib/auth";
import ConnectModule from "@/components/ConnectModule";
export default async function Page() {
  const session = await auth();
  return (
    <ConnectModule
      channel="WHATSAPP"
      schoolId={(session!.user as any).schoolId}
      title="WhatsApp"
      blurb="Meta-approved templates, media attachments, opt-in tracking, automation triggers."
    />
  );
}
