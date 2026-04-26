import { auth } from "@/lib/auth";
import ConnectModule from "@/components/ConnectModule";
export default async function Page() {
  const session = await auth();
  return (
    <ConnectModule
      channel="VOICE"
      schoolId={(session!.user as any).schoolId}
      title="Voice Calls"
      blurb="IVR / auto-call with text-to-speech, call status, retry rules."
    />
  );
}
