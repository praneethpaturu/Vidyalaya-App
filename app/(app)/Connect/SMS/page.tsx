import { auth } from "@/lib/auth";
import ConnectModule from "@/components/ConnectModule";

export default async function Page() {
  const session = await auth();
  return (
    <ConnectModule
      channel="SMS"
      schoolId={(session!.user as any).schoolId}
      title="SMS"
      blurb="DLT-approved templates, bulk send to filters, schedule, delivery report."
    />
  );
}
