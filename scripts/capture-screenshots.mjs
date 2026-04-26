// Capture full-page screenshots of every route in the app, while signed in as admin.
// Uses puppeteer-core driving the system Chrome.

import puppeteer from "puppeteer-core";
import { mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";
const OUT = "/Users/apple/vidyalaya/screenshots";

const ADMIN_EMAIL = "admin@dpsbangalore.edu.in";
const ADMIN_PWD = "demo1234";

const VIEWPORT = { width: 1440, height: 900, deviceScaleFactor: 2 };

// Lookup IDs we need for dynamic routes (one example each).
function dbScalar(sql) {
  return execSync(`sqlite3 /Users/apple/vidyalaya/prisma/dev.db "${sql}"`).toString().trim();
}
const enquiryId = dbScalar("SELECT id FROM AdmissionEnquiry LIMIT 1;");
const examId = dbScalar("SELECT id FROM OnlineExam LIMIT 1;");
const onlineExamId = examId;
const offlineExamId = dbScalar("SELECT id FROM Exam LIMIT 1;");
const classId = dbScalar("SELECT id FROM Class LIMIT 1;");
const studentId = dbScalar("SELECT id FROM Student LIMIT 1;");
const transportBusId = dbScalar("SELECT id FROM Bus LIMIT 1;");
const payslipId = dbScalar("SELECT id FROM Payslip LIMIT 1;");
const paymentId = dbScalar("SELECT id FROM Payment LIMIT 1;");
const invoiceId = dbScalar("SELECT id FROM Invoice LIMIT 1;");
const enquiryRoute = enquiryId ? `/Home/Admissions/${enquiryId}` : null;
const onlineExamRoute = onlineExamId ? `/Home/Online_Exams/${onlineExamId}` : null;
const examRoute = offlineExamId ? `/exams/${offlineExamId}` : null;
const classRoute = classId ? `/classes/${classId}` : null;
const studentRoute = studentId ? `/students/${studentId}` : null;
const transportRoute = transportBusId ? `/transport/${transportBusId}` : null;
const payslipRoute = payslipId ? `/payroll/${payslipId}` : null;

// Each entry: [filename-friendly-name, url]. Filenames keep ordering by section.
const ROUTES = [
  ["00-login",                                   "/login"],

  ["01-Home-Dashboard",                          "/Home"],
  ["01-Home-StudentsMoM",                        "/Home/students-mom"],
  ["01-Home-RoomAllocations",                    "/Home/room-allocations"],
  ["01-Home-EmailNotifications",                 "/Home/email-notifications"],
  ["01-Home-EmailSettings",                      "/Home/email-settings"],
  ["01-Home-ClassesInProgress",                  "/Home/classes-in-progress"],

  ["02-SIS-Enrollments",                         "/Home/SIS"],
  ["02-SIS-Approvals",                           "/Home/SIS/approvals"],
  ["02-SIS-Contracts",                           "/Home/SIS/contracts"],
  ["02-SIS-Timetable",                           "/Home/SIS/timetable"],
  ["02-SIS-Groups",                              "/Home/SIS/groups"],
  ["02-SIS-Documents",                           "/Home/SIS/documents"],
  ["02-SIS-Reports",                             "/Home/SIS/reports"],

  ["03-HR-StaffDetails",                         "/Home/HR"],
  ["03-HR-Attendance",                           "/Home/HR/attendance"],
  ["03-HR-Biometric",                            "/Home/HR/biometric"],
  ["03-HR-Leaves",                               "/Home/HR/leaves"],
  ["03-HR-Tasks",                                "/Home/HR/tasks"],
  ["03-HR-Reports",                              "/Home/HR/reports"],

  ["04-Finance-FeeDaySheet",                     "/Home/Finance"],
  ["04-Finance-Approvals",                       "/Home/Finance/approvals"],
  ["04-Finance-Concessions",                     "/Home/Finance/concessions"],
  ["04-Finance-Collections",                     "/Home/Finance/collections"],
  ["04-Finance-Audit",                           "/Home/Finance/audit"],
  ["04-Finance-Scholarship",                     "/Home/Finance/scholarship"],
  ["04-Finance-Dues",                            "/Home/Finance/dues"],
  ["04-Finance-Log",                             "/Home/Finance/log"],
  ["04-Finance-Reports",                         "/Home/Finance/reports"],

  ["05-Admissions-Enquiries",                    "/Home/Admissions"],
  ["05-Admissions-NewEnquiry",                   "/Home/Admissions/new"],
  ["05-Admissions-PreAdmission",                 "/Home/Admissions/pre-admission"],
  ["05-Admissions-Documents",                    "/Home/Admissions/documents"],
  ["05-Admissions-MIS",                          "/Home/Admissions/mis"],
  ["05-Admissions-Approvals",                    "/Home/Admissions/approvals"],
  ["05-Admissions-Reports",                      "/Home/Admissions/reports"],
  ...(enquiryRoute ? [["05-Admissions-EnquiryDetail", enquiryRoute]] : []),

  ["06-Visitor-Entry",                           "/Home/Visitor_Mgmt"],
  ["06-Visitor-Log",                             "/Home/Visitor_Mgmt/log"],
  ["06-Visitor-PreRegistered",                   "/Home/Visitor_Mgmt/pre-registered"],
  ["06-Visitor-Purposes",                        "/Home/Visitor_Mgmt/purposes"],
  ["06-Visitor-Categories",                      "/Home/Visitor_Mgmt/categories"],
  ["06-Visitor-Banned",                          "/Home/Visitor_Mgmt/banned"],
  ["06-Visitor-Badge",                           "/Home/Visitor_Mgmt/badge"],
  ["06-Visitor-Reports",                         "/Home/Visitor_Mgmt/reports"],
  ["06-Visitor-Settings",                        "/Home/Visitor_Mgmt/settings"],

  ["07-Transport-Dashboard",                     "/Home/Transport"],
  ["07-Transport-VTS",                           "/Home/Transport/vts"],
  ["07-Transport-Attendance",                    "/Home/Transport/attendance"],
  ["07-Transport-Reports",                       "/Home/Transport/reports"],
  ["07-Transport-LegacyList",                    "/transport"],
  ["07-Transport-LiveMap",                       "/transport/live"],
  ...(transportRoute ? [["07-Transport-BusDetail", transportRoute]] : []),

  ["08-Certificates-Settings",                   "/Home/Certificates"],
  ["08-Certificates-IDCards",                    "/Home/Certificates/id-cards"],
  ["08-Certificates-General",                    "/Home/Certificates/general"],
  ["08-Certificates-TC",                         "/Home/Certificates/tc"],
  ["08-Certificates-Achievements",               "/Home/Certificates/achievements"],
  ["08-Certificates-Bonafide",                   "/Home/Certificates/bonafide"],
  ["08-Certificates-Reports",                    "/Home/Certificates/reports"],

  ["09-Library-DaySheet",                        "/Home/Library"],
  ["09-Library-Digital",                         "/Home/Library/digital"],
  ["09-Library-Settings",                        "/Home/Library/settings"],
  ["09-Library-Assessment",                      "/Home/Library/assessment"],
  ["09-Library-Reports",                         "/Home/Library/reports"],
  ["09-Library-LegacyCatalogue",                 "/library"],
  ["09-Library-Issues",                          "/library/issues"],

  ["10-Hostel-BuildingDetail",                   "/Home/Hostel"],
  ["10-Hostel-Management",                       "/Home/Hostel/management"],
  ["10-Hostel-Meals",                            "/Home/Hostel/meals"],
  ["10-Hostel-Others",                           "/Home/Hostel/others"],
  ["10-Hostel-Reports",                          "/Home/Hostel/reports"],

  ["11-OnlineExams-List",                        "/Home/Online_Exams"],
  ["11-OnlineExams-New",                         "/Home/Online_Exams/new"],
  ["11-OnlineExams-Reports",                     "/Home/Online_Exams/reports"],
  ...(onlineExamRoute ? [["11-OnlineExams-Detail", onlineExamRoute]] : []),

  ["12-LMS-Classes",                             "/classes"],
  ...(classRoute ? [["12-LMS-ClassDetail", classRoute]] : []),
  ["12-LMS-Assignments",                         "/LMS/Assignments"],
  ["12-LMS-TeachingPlan",                        "/LMS/TeachingPlan"],
  ["12-LMS-OnlineClasses",                       "/LMS/OnlineClasses"],
  ["12-LMS-Content",                             "/LMS/Content"],
  ["12-LMS-Baseline",                            "/LMS/Baseline"],
  ["12-LMS-Reflections",                         "/LMS/Reflections"],
  ["12-LMS-NEPHPC",                              "/LMS/NEPHPC"],
  ["12-LMS-Subjects",                            "/LMS/Subjects"],
  ["12-LMS-Observation",                         "/LMS/Observation"],
  ["12-LMS-Taxonomy",                            "/LMS/Taxonomy"],

  ["13-Connect-SMS",                             "/Connect/SMS"],
  ["13-Connect-WhatsApp",                        "/Connect/WhatsApp"],
  ["13-Connect-Email",                           "/Connect/Email"],
  ["13-Connect-Voice",                           "/Connect/Voice"],
  ["13-Connect-Diary",                           "/Connect/Diary"],
  ["13-Connect-Photos",                          "/Connect/Photos"],
  ["13-Connect-Wall",                            "/Connect/Wall"],

  ["14-Concerns-List",                           "/Concerns"],
  ["14-Concerns-New",                            "/Concerns/new"],
  ["14-Mentors",                                 "/Mentors"],
  ["14-Achievements",                            "/Achievements"],
  ["14-Placements",                              "/Placements"],
  ["14-Store",                                   "/Store"],
  ["14-Expenses",                                "/Expenses"],
  ["14-Canteen",                                 "/Canteen"],
  ["14-Budget",                                  "/Budget"],
  ["14-MobileApps",                              "/MobileApps"],
  ["14-DynamicForms",                            "/DynamicForms"],
  ["14-LearnerProfile",                          "/LearnerProfile"],
  ["14-LoginStats",                              "/LoginStats"],

  ["15-Settings",                                "/Settings"],
  ["15-Audit",                                   "/audit"],
  ["15-Messages",                                "/messages"],
  ["15-Announcements",                           "/announcements"],
  ["15-Events",                                  "/events"],
  ["15-Timetable",                               "/timetable"],
  ["15-Exams",                                   "/exams"],
  ...(examRoute ? [["15-ExamDetail", examRoute]] : []),
  ["15-Payments",                                "/payments"],
  ["15-Payroll",                                 "/payroll"],
  ...(payslipRoute ? [["15-PayslipDetail", payslipRoute]] : []),
  ["15-Fees",                                    "/fees"],
  ["15-Inventory",                               "/inventory"],
  ["15-InventoryPO",                             "/inventory/po"],
  ["15-People",                                  "/people"],
  ...(studentRoute ? [["15-StudentDetail", studentRoute]] : []),
  ["15-Profile",                                 "/profile"],

  ["16-Tax-Hub",                                 "/tax"],
  ["16-Tax-Calendar",                            "/tax/calendar"],
  ["16-Tax-Challans",                            "/tax/challans"],
  ["16-Tax-Profile",                             "/tax/profile"],
  ["16-Tax-24Q",                                 "/tax/24q"],
  ["16-Tax-VendorTDS",                           "/tax/vendor-tds"],
  ["16-Tax-Form16",                              "/tax/form16"],
  ["16-Tax-EPF",                                 "/tax/epf"],
  ["16-HR-LegacyAttendance",                     "/hr/attendance"],
  ["16-HR-LegacyLeave",                          "/hr/leave"],
  ["16-HR-Tax",                                  "/hr/tax"],
  ["16-HR-Compliance",                           "/hr/compliance"],
];

(async () => {
  if (!existsSync(OUT)) await mkdir(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    defaultViewport: VIEWPORT,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);

  // Sign in
  console.log("Signing in...");
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle2" });
  await page.type('input[type="email"]', ADMIN_EMAIL);
  await page.type('input[type="password"]', ADMIN_PWD);
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle2" }).catch(() => {}),
    page.evaluate(() => {
      const form = document.querySelector("form");
      if (form) form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      // Also click in case submit handler relies on click
      const btn = Array.from(document.querySelectorAll("button"))
        .find((b) => /sign in/i.test(b.textContent ?? ""));
      btn?.click();
    }),
  ]);
  // Some apps redirect via client; wait a beat then verify
  await new Promise((r) => setTimeout(r, 1500));
  console.log("Signed in. Capturing", ROUTES.length, "routes...");

  let ok = 0, fail = 0;
  for (const [name, url] of ROUTES) {
    const target = url.startsWith("http") ? url : `${BASE}${url}`;
    const file = join(OUT, `${name}.png`);
    try {
      await page.goto(target, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 600)); // settle animations / hover states
      await page.screenshot({ path: file, fullPage: true });
      ok++;
      console.log(`✔ ${name.padEnd(35)} ${url}`);
    } catch (e) {
      fail++;
      console.log(`✘ ${name.padEnd(35)} ${url}  → ${e.message?.slice(0, 80) ?? e}`);
    }
  }

  await browser.close();
  console.log(`\nDone: ${ok} OK, ${fail} failed. Saved to ${OUT}`);
})();
