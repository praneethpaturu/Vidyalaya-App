// iCal export for school calendar — lets parents subscribe in
// Google Calendar / Outlook / Apple Calendar.

type Event = {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end?: Date;
  audience?: string;
};

function fmt(d: Date): string {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
function escapeIcal(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildIcal(events: Event[], calendarName = "Vidyalaya School Calendar"): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vidyalaya//SchoolCalendar//EN",
    `X-WR-CALNAME:${escapeIcal(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.id}@vidyalaya`,
      `DTSTAMP:${fmt(new Date())}`,
      `DTSTART:${fmt(e.start)}`,
      `DTEND:${fmt(e.end ?? new Date(e.start.getTime() + 3600_000))}`,
      `SUMMARY:${escapeIcal(e.title)}`,
      e.description ? `DESCRIPTION:${escapeIcal(e.description)}` : "",
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.filter(Boolean).join("\r\n");
}
