import { prisma } from "@/lib/db";
import { toCsv } from "@/lib/csv";

// Each preset takes a schoolId, runs queries, and returns a row set
// suitable for CSV export plus a label for the "Recently generated" log.

export type PresetKey =
  | "daily_fee_collection"
  | "class_attendance_summary"
  | "bus_utilisation"
  | "library_overdue_books"
  | "hostel_occupancy"
  | "staff_payroll_register"
  | "admissions_funnel"
  | "concerns_sla"
  | "concession_utilisation"
  | "online_exam_attempts";

export type PresetMeta = { key: PresetKey; name: string; category: string };

export const PRESETS: PresetMeta[] = [
  { key: "daily_fee_collection",     name: "Daily fee collection",         category: "FINANCE"    },
  { key: "class_attendance_summary", name: "Class attendance summary",     category: "SIS"        },
  { key: "bus_utilisation",          name: "Bus utilisation",              category: "TRANSPORT"  },
  { key: "library_overdue_books",    name: "Library overdue books",        category: "LIBRARY"    },
  { key: "hostel_occupancy",         name: "Hostel occupancy",             category: "HOSTEL"     },
  { key: "staff_payroll_register",   name: "Staff payroll register",       category: "HR"         },
  { key: "admissions_funnel",        name: "Admissions funnel",            category: "ADMISSIONS" },
  { key: "concerns_sla",             name: "Concerns SLA breaches",        category: "CONNECT"    },
  { key: "concession_utilisation",   name: "Concession utilisation",       category: "FINANCE"    },
  { key: "online_exam_attempts",     name: "Online exam attempt analytics",category: "LMS"        },
];

export type RunResult = {
  meta: PresetMeta;
  rows: Record<string, string | number>[];
  columns: { key: string; label: string }[];
  csv: string;
};

function inrPaiseToRupees(p: number): string {
  return (p / 100).toFixed(2);
}

export async function runPreset(
  key: PresetKey,
  schoolId: string,
): Promise<RunResult> {
  const meta = PRESETS.find((p) => p.key === key);
  if (!meta) throw new Error("unknown-preset");
  const today = new Date(); today.setHours(0, 0, 0, 0);

  let rows: Record<string, any>[] = [];
  let columns: { key: string; label: string }[] = [];

  switch (key) {
    case "daily_fee_collection": {
      const payments = await prisma.payment.findMany({
        where: { schoolId, paidAt: { gte: today } },
        include: { invoice: { include: { student: { include: { user: true } } } } },
        orderBy: { paidAt: "desc" },
      });
      rows = payments.map((p) => ({
        receiptNo: p.receiptNo,
        student: p.invoice?.student.user.name ?? "—",
        admissionNo: p.invoice?.student.admissionNo ?? "—",
        invoiceNo: p.invoice?.number ?? "—",
        amount: inrPaiseToRupees(p.amount),
        method: p.method,
        txnRef: p.txnRef ?? "",
        paidAt: new Date(p.paidAt).toLocaleString("en-IN"),
      }));
      columns = [
        { key: "receiptNo",   label: "Receipt"    },
        { key: "student",     label: "Student"    },
        { key: "admissionNo", label: "Adm No"     },
        { key: "invoiceNo",   label: "Invoice"    },
        { key: "amount",      label: "Amount (₹)" },
        { key: "method",      label: "Method"     },
        { key: "txnRef",      label: "Txn ref"    },
        { key: "paidAt",      label: "Paid"       },
      ];
      break;
    }

    case "class_attendance_summary": {
      const classes = await prisma.class.findMany({
        where: { schoolId },
        include: {
          students: { where: { deletedAt: null }, select: { id: true } },
          attendance: { where: { date: today } },
        },
        orderBy: [{ grade: "asc" }, { section: "asc" }],
      });
      rows = classes.map((c) => {
        const total = c.students.length;
        const present = c.attendance.filter((a) => a.status === "PRESENT").length;
        const absent  = c.attendance.filter((a) => a.status === "ABSENT").length;
        const late    = c.attendance.filter((a) => a.status === "LATE").length;
        return {
          class: c.name,
          total,
          marked: c.attendance.length,
          present,
          absent,
          late,
          notMarked: total - c.attendance.length,
          presentPct: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      });
      columns = [
        { key: "class",      label: "Class"     },
        { key: "total",      label: "Roll size" },
        { key: "marked",     label: "Marked"    },
        { key: "present",    label: "Present"   },
        { key: "absent",     label: "Absent"    },
        { key: "late",       label: "Late"      },
        { key: "notMarked",  label: "Not marked"},
        { key: "presentPct", label: "Present %" },
      ];
      break;
    }

    case "bus_utilisation": {
      const buses = await prisma.bus.findMany({
        where: { schoolId },
        include: {
          route: { include: { stops: { include: { _count: { select: { students: true } } } } } },
        },
      });
      rows = buses.map((b) => {
        const onRoute = b.route?.stops.reduce((s, x) => s + x._count.students, 0) ?? 0;
        return {
          number: b.number,
          route: b.route?.name ?? "—",
          capacity: b.capacity,
          assigned: onRoute,
          utilPct: b.capacity > 0 ? Math.round((onRoute / b.capacity) * 100) : 0,
          status: b.active ? "Active" : "Inactive",
        };
      });
      columns = [
        { key: "number",   label: "Bus"      },
        { key: "route",    label: "Route"    },
        { key: "capacity", label: "Capacity" },
        { key: "assigned", label: "Assigned" },
        { key: "utilPct",  label: "Util %"   },
        { key: "status",   label: "Status"   },
      ];
      break;
    }

    case "library_overdue_books": {
      const issues = await prisma.bookIssue.findMany({
        where: { schoolId, returnedAt: null, dueDate: { lt: new Date() } },
        include: { book: true, student: { include: { user: true, class: true } } },
        orderBy: { dueDate: "asc" },
      });
      rows = issues.map((i) => ({
        title: i.book.title,
        author: i.book.author ?? "",
        student: i.student?.user.name ?? "—",
        admissionNo: i.student?.admissionNo ?? "",
        class: i.student?.class?.name ?? "—",
        issuedAt: new Date(i.issuedAt).toLocaleDateString("en-IN"),
        dueDate: new Date(i.dueDate).toLocaleDateString("en-IN"),
        daysOverdue: Math.max(0, Math.floor((Date.now() - +i.dueDate) / 86400000)),
        fine: inrPaiseToRupees(i.fineAmount),
      }));
      columns = [
        { key: "title",       label: "Title"        },
        { key: "author",      label: "Author"       },
        { key: "student",     label: "Student"      },
        { key: "admissionNo", label: "Adm No"       },
        { key: "class",       label: "Class"        },
        { key: "issuedAt",    label: "Issued"       },
        { key: "dueDate",     label: "Due"          },
        { key: "daysOverdue", label: "Days overdue" },
        { key: "fine",        label: "Fine (₹)"     },
      ];
      break;
    }

    case "hostel_occupancy": {
      const buildings = await prisma.hostelBuilding.findMany({
        where: { schoolId },
        include: {
          floors: {
            include: {
              rooms: {
                include: { beds: true },
              },
            },
          },
        },
      });
      rows = [];
      for (const b of buildings) for (const f of b.floors) for (const r of f.rooms) {
        const total = r.beds.length;
        const occupied = r.beds.filter((bd) => bd.status === "OCCUPIED").length;
        rows.push({
          building: b.name,
          floor: f.name,
          room: r.number,
          total,
          occupied,
          vacant: total - occupied,
          utilPct: total > 0 ? Math.round((occupied / total) * 100) : 0,
        });
      }
      columns = [
        { key: "building", label: "Building" },
        { key: "floor",    label: "Floor"    },
        { key: "room",     label: "Room"     },
        { key: "total",    label: "Beds"     },
        { key: "occupied", label: "Occupied" },
        { key: "vacant",   label: "Vacant"   },
        { key: "utilPct",  label: "Util %"   },
      ];
      break;
    }

    case "staff_payroll_register": {
      const now = new Date();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();
      const payslips = await prisma.payslip.findMany({
        where: { schoolId, month, year },
        include: { staff: { include: { user: true } } },
      });
      rows = payslips.map((p) => ({
        empId: p.staff.employeeId,
        name: p.staff.user.name,
        designation: p.staff.designation,
        worked: p.workedDays,
        lop: p.lopDays,
        basic: inrPaiseToRupees(p.basic),
        hra: inrPaiseToRupees(p.hra),
        gross: inrPaiseToRupees(p.gross),
        pf: inrPaiseToRupees(p.pf),
        esi: inrPaiseToRupees(p.esi),
        tds: inrPaiseToRupees(p.tds),
        deductions: inrPaiseToRupees(p.totalDeductions),
        net: inrPaiseToRupees(p.net),
        status: p.status,
      }));
      columns = [
        { key: "empId",       label: "Emp ID"    },
        { key: "name",        label: "Name"      },
        { key: "designation", label: "Designation" },
        { key: "worked",      label: "Worked"    },
        { key: "lop",         label: "LOP"       },
        { key: "basic",       label: "Basic"     },
        { key: "hra",         label: "HRA"       },
        { key: "gross",       label: "Gross"     },
        { key: "pf",          label: "PF"        },
        { key: "esi",         label: "ESI"       },
        { key: "tds",         label: "TDS"       },
        { key: "deductions",  label: "Total Ded" },
        { key: "net",         label: "Net"       },
        { key: "status",      label: "Status"    },
      ];
      break;
    }

    case "admissions_funnel": {
      const all = await prisma.admissionEnquiry.groupBy({
        by: ["status"],
        where: { schoolId },
        _count: { _all: true },
      });
      rows = all.map((a) => ({ stage: a.status, count: a._count._all }));
      columns = [
        { key: "stage", label: "Stage" },
        { key: "count", label: "Count" },
      ];
      break;
    }

    case "concerns_sla": {
      const concerns = await prisma.concern.findMany({
        where: {
          schoolId,
          status: { in: ["OPEN", "IN_PROGRESS"] },
        },
        orderBy: { createdAt: "asc" },
      });
      rows = concerns.map((c) => {
        const ageHours = Math.floor((Date.now() - +c.createdAt) / 3_600_000);
        return {
          id: c.id.slice(-6),
          subject: c.subject,
          category: c.category,
          severity: c.severity,
          status: c.status,
          ageHours,
          createdAt: new Date(c.createdAt).toLocaleString("en-IN"),
        };
      });
      columns = [
        { key: "id",        label: "ID"       },
        { key: "subject",   label: "Subject"  },
        { key: "category",  label: "Category" },
        { key: "severity",  label: "Severity" },
        { key: "status",    label: "Status"   },
        { key: "ageHours",  label: "Age (h)"  },
        { key: "createdAt", label: "Opened"   },
      ];
      break;
    }

    case "concession_utilisation": {
      const concs = await prisma.studentConcession.findMany({
        where: { schoolId, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
      });
      const ids = concs.map((c) => c.studentId);
      const students = await prisma.student.findMany({
        where: { id: { in: ids } },
        include: { user: true, class: true },
      });
      const sMap = new Map(students.map((s) => [s.id, s]));
      const types = new Map((await prisma.concessionType.findMany({ where: { schoolId } })).map((t) => [t.id, t.name]));
      rows = concs.map((c) => {
        const s = sMap.get(c.studentId);
        return {
          student: s?.user.name ?? c.studentId,
          admissionNo: s?.admissionNo ?? "",
          class: s?.class?.name ?? "—",
          type: c.typeId ? types.get(c.typeId) ?? "—" : "—",
          amount: inrPaiseToRupees(c.amount),
          pct: c.pct,
          reason: c.reason ?? "",
          effectiveFrom: new Date(c.effectiveFrom).toLocaleDateString("en-IN"),
        };
      });
      columns = [
        { key: "student",       label: "Student"      },
        { key: "admissionNo",   label: "Adm No"       },
        { key: "class",         label: "Class"        },
        { key: "type",          label: "Type"         },
        { key: "amount",        label: "Amount (₹)"   },
        { key: "pct",           label: "%"            },
        { key: "reason",        label: "Reason"       },
        { key: "effectiveFrom", label: "Effective from" },
      ];
      break;
    }

    case "online_exam_attempts": {
      const exams = await prisma.onlineExam.findMany({
        where: { schoolId },
        include: { _count: { select: { questions: true, attemptsLog: true } } },
        orderBy: { startAt: "desc" },
        take: 100,
      });
      rows = exams.map((e) => ({
        title: e.title,
        flavor: e.flavor,
        startAt: new Date(e.startAt).toLocaleString("en-IN"),
        durationMin: e.durationMin,
        questions: e._count.questions,
        attempts: e._count.attemptsLog,
        totalMarks: e.totalMarks,
        passMarks: e.passMarks,
        status: e.status,
      }));
      columns = [
        { key: "title",       label: "Title"      },
        { key: "flavor",      label: "Flavor"     },
        { key: "startAt",     label: "Scheduled"  },
        { key: "durationMin", label: "Duration"   },
        { key: "questions",   label: "Questions"  },
        { key: "attempts",    label: "Attempts"   },
        { key: "totalMarks",  label: "Total"      },
        { key: "passMarks",   label: "Pass"       },
        { key: "status",      label: "Status"     },
      ];
      break;
    }
  }

  return { meta, rows, columns, csv: toCsv(rows as any, columns as any) };
}
