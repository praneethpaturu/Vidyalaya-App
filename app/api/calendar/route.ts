import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calendar } from "@/lib/integrations";

export const runtime = "nodejs";

// Public-ish iCal feed — protected by user session for now.
// To make it Google Calendar-subscribable, add an /api/calendar/[token]
// flavour that uses a per-user token instead of a session cookie.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauth" }, { status: 401 });
  const sId = (session.user as any).schoolId as string;

  const events = await prisma.schoolEvent.findMany({
    where: { schoolId: sId },
    orderBy: { startsAt: "asc" },
    take: 200,
  }).catch(async () => {
    // Older instances of the app called this `SchoolEvent`; the seed file
    // uses `event` field names. Fall back to an empty list if shape mismatch.
    return [] as any[];
  });

  const ical = calendar.buildIcal(
    events.map((e: any) => ({
      id: e.id,
      title: e.title ?? e.name ?? "Event",
      description: e.description,
      start: e.startsAt ?? e.startAt ?? e.date ?? new Date(),
      end: e.endsAt ?? e.endAt ?? undefined,
    })),
    "Vidyalaya School Calendar",
  );

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vidyalaya.ics"',
      "Cache-Control": "private, max-age=900",
    },
  });
}
