import { auth } from "@/lib/auth";
import ConnectModule from "@/components/ConnectModule";
export default async function Page() {
  const session = await auth();
  return (
    <ConnectModule
      channel="EMAIL"
      schoolId={(session!.user as any).schoolId}
      title="Email"
      blurb="WYSIWYG editor, merge fields, bulk + scheduled, attachment limits, bounce handling."
    />
  );
}
