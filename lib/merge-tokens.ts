import { prisma } from "@/lib/db";

// Expand merge tokens in message bodies before they go out.
// Supported tokens (case-sensitive):
//   {{school.name}}        — sender school name
//   {{school.city}}
//   {{school.phone}}
//   {{user.name}}          — recipient's display name
//   {{user.email}}
//   {{user.phone}}
//   {{student.name}}       — for parent/student recipients
//   {{student.admissionNo}}
//   {{student.class}}
//   {{parent.name}}        — guardian display name (for parent recipients)
//   {{date}}, {{time}}     — current date/time in en-IN
//
// We resolve the recipient-specific values from a single Prisma round-trip
// per message, then substitute into the body. Unresolvable tokens are left
// as-is so the operator can see and fix them.

type Ctx = {
  schoolId: string;
  userId?: string | null;
};

export async function expandTokens(body: string, ctx: Ctx): Promise<string> {
  if (!body || !body.includes("{{")) return body;
  const map: Record<string, string> = {};

  const today = new Date();
  map["date"] = today.toLocaleDateString("en-IN");
  map["time"] = today.toLocaleTimeString("en-IN");

  const school = await prisma.school.findUnique({
    where: { id: ctx.schoolId },
    select: { name: true, city: true, state: true, phone: true, email: true },
  });
  if (school) {
    map["school.name"]  = school.name;
    map["school.city"]  = school.city;
    map["school.state"] = school.state;
    map["school.phone"] = school.phone;
    map["school.email"] = school.email;
  }

  if (ctx.userId) {
    const user = await prisma.user.findUnique({
      where: { id: ctx.userId },
      select: { name: true, email: true, phone: true, role: true },
    });
    if (user) {
      map["user.name"]  = user.name;
      map["user.email"] = user.email;
      map["user.phone"] = user.phone ?? "";
    }

    // STUDENT recipient → {{student.*}}
    const stu = await prisma.student.findFirst({
      where: { userId: ctx.userId },
      include: { user: true, class: true },
    });
    if (stu) {
      map["student.name"]        = stu.user.name;
      map["student.admissionNo"] = stu.admissionNo;
      map["student.class"]       = stu.class?.name ?? "";
    }

    // PARENT recipient → also expose first-linked child as {{student.*}},
    // and the parent's own name as {{parent.name}}.
    if (!stu) {
      const guardian = await prisma.guardian.findFirst({
        where: { userId: ctx.userId },
        include: {
          user: true,
          students: {
            include: { student: { include: { user: true, class: true } } },
            take: 1,
          },
        },
      });
      if (guardian) {
        map["parent.name"] = guardian.user.name;
        const link = guardian.students[0];
        if (link) {
          map["student.name"]        = link.student.user.name;
          map["student.admissionNo"] = link.student.admissionNo;
          map["student.class"]       = link.student.class?.name ?? "";
        }
      }
    }
  }

  return body.replace(/\{\{\s*([a-zA-Z][a-zA-Z0-9_.]*)\s*\}\}/g, (_full, key: string) => {
    return key in map ? map[key] : `{{${key}}}`;
  });
}

// List of tokens for the Connect / drip authoring UI to advertise.
export const TOKEN_HELP = [
  { token: "{{school.name}}",        desc: "School name" },
  { token: "{{school.city}}",        desc: "City" },
  { token: "{{school.phone}}",       desc: "Front-office phone" },
  { token: "{{user.name}}",          desc: "Recipient's display name" },
  { token: "{{student.name}}",       desc: "Student name (for parent/student msgs)" },
  { token: "{{student.admissionNo}}",desc: "Admission number" },
  { token: "{{student.class}}",      desc: "Class name" },
  { token: "{{parent.name}}",        desc: "Parent name (for parent msgs)" },
  { token: "{{date}}",               desc: "Today's date" },
  { token: "{{time}}",               desc: "Current time" },
];
