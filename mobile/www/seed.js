// Seed data for the standalone mobile demo. The app boots with this data
// pre-loaded so it works fully offline without ever talking to a server.
window.LAKSHYA_SEED = {
  school: {
    name: "Lakshya School of Excellence",
    code: "LSE",
    academicYear: "2026-2027",
  },
  user: {
    name: "Praneeth Paturu",
    email: "praneeth@lakshya.test",
    role: "ADMIN",
    roleLabel: "Administrator",
  },
  kpis: {
    students: 412, staff: 56, todayAttendancePct: 0.94,
    feesCollectedPaise: 1842500_00, dueInvoicesCount: 38, openConcerns: 6,
    smsCredits: 1850, voiceCredits: 320, whatsappCredits: 980,
  },

  classes: [
    { id: "c1",  name: "Grade 6 — A",  teacher: "Anita Sharma",   strength: 32 },
    { id: "c2",  name: "Grade 6 — B",  teacher: "Vikram Iyer",    strength: 30 },
    { id: "c3",  name: "Grade 7 — A",  teacher: "Sunita Verma",   strength: 34 },
    { id: "c4",  name: "Grade 7 — B",  teacher: "Rohit Kapoor",   strength: 33 },
    { id: "c5",  name: "Grade 8 — A",  teacher: "Meera Pillai",   strength: 31 },
    { id: "c6",  name: "Grade 9 — A",  teacher: "Arvind Singh",   strength: 29 },
    { id: "c7",  name: "Grade 10 — A", teacher: "Kavitha Rao",    strength: 28 },
  ],

  students: [
    { id: "s1",  admNo: "LSE0001", name: "Aanya Iyer",       class: "Grade 6 — A", roll: 1,  bloodGroup: "B+",  gender: "F" },
    { id: "s2",  admNo: "LSE0002", name: "Aarav Sharma",     class: "Grade 6 — A", roll: 2,  bloodGroup: "O+",  gender: "M" },
    { id: "s3",  admNo: "LSE0003", name: "Aditi Reddy",      class: "Grade 6 — B", roll: 3,  bloodGroup: "A+",  gender: "F" },
    { id: "s4",  admNo: "LSE0004", name: "Arjun Mehta",      class: "Grade 7 — A", roll: 4,  bloodGroup: "AB+", gender: "M" },
    { id: "s5",  admNo: "LSE0005", name: "Ayesha Khan",      class: "Grade 7 — A", roll: 5,  bloodGroup: "B+",  gender: "F" },
    { id: "s6",  admNo: "LSE0006", name: "Devansh Patel",    class: "Grade 7 — B", roll: 6,  bloodGroup: "O-",  gender: "M" },
    { id: "s7",  admNo: "LSE0007", name: "Diya Nair",        class: "Grade 8 — A", roll: 7,  bloodGroup: "A+",  gender: "F" },
    { id: "s8",  admNo: "LSE0008", name: "Ishaan Kapoor",    class: "Grade 8 — A", roll: 8,  bloodGroup: "B-",  gender: "M" },
    { id: "s9",  admNo: "LSE0009", name: "Kavya Rao",        class: "Grade 8 — B", roll: 9,  bloodGroup: "O+",  gender: "F" },
    { id: "s10", admNo: "LSE0010", name: "Mihir Bose",       class: "Grade 9 — A", roll: 10, bloodGroup: "AB-", gender: "M" },
    { id: "s11", admNo: "LSE0011", name: "Riya Saxena",      class: "Grade 9 — A", roll: 11, bloodGroup: "A+",  gender: "F" },
    { id: "s12", admNo: "LSE0012", name: "Vihaan Joshi",     class: "Grade 10 — A", roll: 12, bloodGroup: "B+", gender: "M" },
  ],

  staff: [
    { id: "st1",  empId: "LSE-T-001", name: "Anita Sharma",     designation: "Senior Teacher",       department: "Academics",   joining: "2017-06-12" },
    { id: "st2",  empId: "LSE-T-002", name: "Vikram Iyer",      designation: "Class Teacher",        department: "Academics",   joining: "2019-04-08" },
    { id: "st3",  empId: "LSE-T-003", name: "Sunita Verma",     designation: "Senior Teacher",       department: "Academics",   joining: "2015-07-01" },
    { id: "st4",  empId: "LSE-T-004", name: "Rohit Kapoor",     designation: "Mathematics Teacher",  department: "Academics",   joining: "2020-08-15" },
    { id: "st5",  empId: "LSE-T-005", name: "Meera Pillai",     designation: "English Teacher",      department: "Academics",   joining: "2018-06-20" },
    { id: "st6",  empId: "LSE-T-006", name: "Arvind Singh",     designation: "Science Teacher",      department: "Academics",   joining: "2016-04-10" },
    { id: "st7",  empId: "LSE-A-001", name: "Geetha Rao",       designation: "Accountant",           department: "Finance",     joining: "2014-03-25" },
    { id: "st8",  empId: "LSE-O-001", name: "Mohan Das",        designation: "Office Manager",       department: "Admin",       joining: "2013-09-01" },
    { id: "st9",  empId: "LSE-D-001", name: "Ramesh Kumar",     designation: "Driver",               department: "Transport",   joining: "2018-04-22" },
    { id: "st10", empId: "LSE-D-002", name: "Suresh Babu",      designation: "Driver",               department: "Transport",   joining: "2019-06-12" },
  ],

  buses: [
    { id: "b1", number: "KA-01-AB-1234", driver: "Ramesh Kumar",  capacity: 40, route: "Whitefield Loop",   onboard: 32, status: "EN_ROUTE" },
    { id: "b2", number: "KA-01-AB-1235", driver: "Suresh Babu",   capacity: 40, route: "Indiranagar Loop",  onboard: 28, status: "AT_SCHOOL" },
    { id: "b3", number: "KA-01-AB-1236", driver: "Pradeep Kumar", capacity: 36, route: "Koramangala Loop",  onboard: 30, status: "EN_ROUTE" },
    { id: "b4", number: "KA-01-AB-1237", driver: "Murali Reddy",  capacity: 36, route: "JP Nagar Loop",     onboard: 25, status: "PARKED" },
  ],

  invoices: [
    { id: "i1", studentId: "s1", number: "INV-2026-0001", amountPaise:  85000_00, paidPaise: 85000_00, dueDate: "2026-03-15", status: "PAID" },
    { id: "i2", studentId: "s2", number: "INV-2026-0002", amountPaise:  85000_00, paidPaise: 60000_00, dueDate: "2026-03-15", status: "PARTIAL" },
    { id: "i3", studentId: "s3", number: "INV-2026-0003", amountPaise: 105000_00, paidPaise: 105000_00, dueDate: "2026-03-15", status: "PAID" },
    { id: "i4", studentId: "s4", number: "INV-2026-0004", amountPaise: 105000_00, paidPaise:      0,   dueDate: "2026-03-15", status: "DUE" },
    { id: "i5", studentId: "s5", number: "INV-2026-0005", amountPaise: 105000_00, paidPaise: 105000_00, dueDate: "2026-03-15", status: "PAID" },
    { id: "i6", studentId: "s6", number: "INV-2026-0006", amountPaise: 115000_00, paidPaise:      0,   dueDate: "2026-03-15", status: "DUE" },
    { id: "i7", studentId: "s7", number: "INV-2026-0007", amountPaise: 115000_00, paidPaise: 50000_00, dueDate: "2026-03-15", status: "PARTIAL" },
    { id: "i8", studentId: "s8", number: "INV-2026-0008", amountPaise: 115000_00, paidPaise: 115000_00, dueDate: "2026-03-15", status: "PAID" },
  ],

  payments: [
    { id: "p1", receipt: "RCT-2026-0101", studentName: "Aanya Iyer",   method: "UPI",        amountPaise:  85000_00, paidAt: "2026-04-22" },
    { id: "p2", receipt: "RCT-2026-0102", studentName: "Aditi Reddy",  method: "RAZORPAY",   amountPaise: 105000_00, paidAt: "2026-04-22" },
    { id: "p3", receipt: "RCT-2026-0103", studentName: "Ayesha Khan",  method: "NETBANKING", amountPaise: 105000_00, paidAt: "2026-04-23" },
    { id: "p4", receipt: "RCT-2026-0104", studentName: "Ishaan Kapoor",method: "CARD",       amountPaise: 115000_00, paidAt: "2026-04-23" },
    { id: "p5", receipt: "RCT-2026-0105", studentName: "Aarav Sharma", method: "CASH",       amountPaise:  60000_00, paidAt: "2026-04-24" },
    { id: "p6", receipt: "RCT-2026-0106", studentName: "Diya Nair",    method: "UPI",        amountPaise:  50000_00, paidAt: "2026-04-25" },
  ],

  concessions: [
    { id: "cn1", studentName: "Aanya Iyer",    type: "Sibling",       pct: 10 },
    { id: "cn2", studentName: "Devansh Patel", type: "Staff Ward",    pct: 25 },
    { id: "cn3", studentName: "Mihir Bose",    type: "Merit",         pct: 15 },
    { id: "cn4", studentName: "Vihaan Joshi",  type: "Sports",        pct: 20 },
  ],

  scholarships: [
    { id: "sc1", studentName: "Riya Saxena", scheme: "Need-based scholarship", awardPaise: 50000_00 },
    { id: "sc2", studentName: "Kavya Rao",   scheme: "Merit scholarship",      awardPaise: 30000_00 },
  ],

  enquiries: [
    { id: "e1", childName: "Anika Mishra", grade: "Grade 1",  parent: "Sunita Mishra", phone: "98xxxxxx10", source: "WALK_IN",   status: "VISITED",  followUp: "2026-04-28" },
    { id: "e2", childName: "Vivaan Roy",   grade: "Grade 5",  parent: "Anjali Roy",    phone: "98xxxxxx11", source: "WEB",       status: "CONTACTED", followUp: "2026-04-29" },
    { id: "e3", childName: "Saanvi Pillai",grade: "Grade 3",  parent: "Krishna Pillai",phone: "98xxxxxx12", source: "REFERRAL",  status: "OFFERED",   followUp: "2026-04-27" },
    { id: "e4", childName: "Reyansh Goel", grade: "Grade 2",  parent: "Manish Goel",   phone: "98xxxxxx13", source: "EVENT",     status: "ENQUIRY",   followUp: "2026-05-02" },
    { id: "e5", childName: "Inaaya Khan",  grade: "Grade 6",  parent: "Faisal Khan",   phone: "98xxxxxx14", source: "CAMPAIGN",  status: "ENROLLED",  followUp: null },
    { id: "e6", childName: "Aarush Bansal",grade: "Grade 4",  parent: "Priya Bansal",  phone: "98xxxxxx15", source: "REFERRAL",  status: "VISITED",   followUp: "2026-04-30" },
  ],

  visitors: [
    { id: "v1", name: "Ravi Kumar",    purpose: "Parent Visit",     hostName: "Anita Sharma",   inAt: "2026-04-26 10:15", outAt: null,            status: "INSIDE" },
    { id: "v2", name: "Pawan Gupta",   purpose: "Vendor",           hostName: "Mohan Das",      inAt: "2026-04-26 10:40", outAt: "2026-04-26 11:25", status: "OUT" },
    { id: "v3", name: "Smita Iyer",    purpose: "Admission Enquiry",hostName: "Front Desk",     inAt: "2026-04-26 11:50", outAt: null,            status: "INSIDE" },
    { id: "v4", name: "Sanjay Mehta",  purpose: "Audit",            hostName: "Geetha Rao",     inAt: "2026-04-26 09:30", outAt: "2026-04-26 12:00", status: "OUT" },
  ],

  books: [
    { id: "bk1",  title: "Wings of Fire",                author: "A. P. J. Abdul Kalam",     category: "Biography",   shelf: "B-12", available: 3, total: 5 },
    { id: "bk2",  title: "The Magic Garden",             author: "Ruskin Bond",              category: "Fiction",     shelf: "F-04", available: 4, total: 6 },
    { id: "bk3",  title: "Train to Pakistan",            author: "Khushwant Singh",          category: "Fiction",     shelf: "F-09", available: 1, total: 3 },
    { id: "bk4",  title: "The Discovery of India",       author: "Jawaharlal Nehru",         category: "History",     shelf: "H-02", available: 2, total: 2 },
    { id: "bk5",  title: "Malgudi Days",                 author: "R. K. Narayan",            category: "Fiction",     shelf: "F-11", available: 5, total: 6 },
    { id: "bk6",  title: "Panchatantra",                 author: "Vishnu Sharma",            category: "Children",    shelf: "C-01", available: 8, total: 10 },
    { id: "bk7",  title: "An Era of Darkness",           author: "Shashi Tharoor",           category: "History",     shelf: "H-05", available: 0, total: 2 },
    { id: "bk8",  title: "The Difficulty of Being Good", author: "Gurcharan Das",            category: "Philosophy",  shelf: "P-02", available: 1, total: 1 },
    { id: "bk9",  title: "Three Mistakes of My Life",    author: "Chetan Bhagat",            category: "Fiction",     shelf: "F-15", available: 2, total: 4 },
    { id: "bk10", title: "Indian Mathematics",           author: "George G. Joseph",         category: "Reference",   shelf: "R-08", available: 3, total: 3 },
  ],

  hostel: {
    buildings: [
      { id: "hb1", name: "Vishakha Hall",   floors: 3, rooms: 24, capacity: 96, occupied: 78 },
      { id: "hb2", name: "Yashodhara Hall", floors: 3, rooms: 22, capacity: 88, occupied: 71 },
    ],
    rooms: [
      { id: "hr1", building: "Vishakha Hall",   number: "201", capacity: 4, occupied: 3, status: "OCCUPIED"   },
      { id: "hr2", building: "Vishakha Hall",   number: "202", capacity: 4, occupied: 4, status: "OCCUPIED"   },
      { id: "hr3", building: "Vishakha Hall",   number: "203", capacity: 4, occupied: 0, status: "VACANT"     },
      { id: "hr4", building: "Yashodhara Hall", number: "101", capacity: 4, occupied: 4, status: "OCCUPIED"   },
      { id: "hr5", building: "Yashodhara Hall", number: "102", capacity: 4, occupied: 2, status: "OCCUPIED"   },
      { id: "hr6", building: "Yashodhara Hall", number: "103", capacity: 4, occupied: 0, status: "MAINTENANCE"},
    ],
    meals: [
      { day: "Mon", breakfast: "Idli, sambar, chutney",     lunch: "Rice, dal, mixed veg, curd",      snacks: "Tea, biscuits", dinner: "Chapati, paneer butter, rice" },
      { day: "Tue", breakfast: "Poha, peanuts",             lunch: "Rice, rasam, beans, papad",       snacks: "Cookies, milk", dinner: "Veg pulao, raita" },
      { day: "Wed", breakfast: "Dosa, coconut chutney",     lunch: "Roti, kadhi pakora, sabzi",       snacks: "Tea, samosa",   dinner: "Khichdi, papad, salad" },
      { day: "Thu", breakfast: "Upma, banana",              lunch: "Rice, sambar, beetroot poriyal",  snacks: "Coffee, mixture",dinner: "Chapati, dal makhani" },
      { day: "Fri", breakfast: "Vada, sambar, chutney",     lunch: "Rice, dal, gobi 65, curd",        snacks: "Tea, biscuits", dinner: "Pulao, mixed veg curry" },
    ],
  },

  exams: [
    { id: "ex1", title: "Mid-term — Mathematics",  class: "Grade 7 — A", date: "2026-05-04", duration: 90, type: "OBJECTIVE",   status: "PUBLISHED" },
    { id: "ex2", title: "Mid-term — Science",      class: "Grade 7 — A", date: "2026-05-05", duration: 90, type: "DESCRIPTIVE", status: "DRAFT" },
    { id: "ex3", title: "Mid-term — English",      class: "Grade 7 — A", date: "2026-05-06", duration: 90, type: "DESCRIPTIVE", status: "PUBLISHED" },
    { id: "ex4", title: "Unit Test 3 — Maths",     class: "Grade 6 — A", date: "2026-04-29", duration: 45, type: "OBJECTIVE",   status: "LIVE" },
    { id: "ex5", title: "Unit Test 3 — Hindi",     class: "Grade 6 — B", date: "2026-04-30", duration: 45, type: "DESCRIPTIVE", status: "PUBLISHED" },
  ],

  events: [
    { id: "ev1", title: "Sports Day Rehearsal",     date: "2026-05-06", type: "SPORTS",  audience: "ALL" },
    { id: "ev2", title: "Parent–Teacher Meeting",   date: "2026-05-10", type: "PTM",     audience: "PARENTS" },
    { id: "ev3", title: "Annual Day",                date: "2026-05-25", type: "CULTURAL",audience: "ALL" },
    { id: "ev4", title: "Math Olympiad Round 2",    date: "2026-05-12", type: "EXAM",    audience: "STUDENTS" },
    { id: "ev5", title: "Library Week",              date: "2026-05-02", type: "EVENT",   audience: "STUDENTS" },
    { id: "ev6", title: "Independence Day",          date: "2026-08-15", type: "HOLIDAY", audience: "ALL" },
    { id: "ev7", title: "Teacher Workshop — NEP",    date: "2026-05-18", type: "EVENT",   audience: "STAFF" },
  ],

  inventory: [
    { id: "iv1",  name: "Notebooks (200 pages)", category: "Stationery", qty: 1240, unit: "ea",   reorder: 200 },
    { id: "iv2",  name: "Whiteboard markers",    category: "Stationery", qty:  185, unit: "ea",   reorder:  60 },
    { id: "iv3",  name: "Lab beakers (250ml)",   category: "Lab",        qty:   42, unit: "ea",   reorder:  20 },
    { id: "iv4",  name: "Footballs",             category: "Sports",     qty:   18, unit: "ea",   reorder:   8 },
    { id: "iv5",  name: "Cricket bats",          category: "Sports",     qty:    9, unit: "ea",   reorder:   6 },
    { id: "iv6",  name: "First aid kits",        category: "Medical",    qty:   12, unit: "ea",   reorder:   4 },
    { id: "iv7",  name: "Toilet paper rolls",    category: "Hygiene",    qty:  280, unit: "rolls",reorder: 100 },
    { id: "iv8",  name: "Dusters",               category: "Cleaning",   qty:   46, unit: "ea",   reorder:  20 },
    { id: "iv9",  name: "Chairs (student)",      category: "Furniture",  qty:  450, unit: "ea",   reorder:   0 },
    { id: "iv10", name: "Desks (student)",       category: "Furniture",  qty:  220, unit: "ea",   reorder:   0 },
  ],

  payroll: [
    { id: "ps1", staffName: "Anita Sharma",   month: "Mar 2026", grossPaise: 65000_00, deductionsPaise:  9000_00, netPaise: 56000_00, status: "PAID" },
    { id: "ps2", staffName: "Vikram Iyer",    month: "Mar 2026", grossPaise: 55000_00, deductionsPaise:  7500_00, netPaise: 47500_00, status: "PAID" },
    { id: "ps3", staffName: "Sunita Verma",   month: "Mar 2026", grossPaise: 70000_00, deductionsPaise: 10000_00, netPaise: 60000_00, status: "PAID" },
    { id: "ps4", staffName: "Geetha Rao",     month: "Mar 2026", grossPaise: 48000_00, deductionsPaise:  6500_00, netPaise: 41500_00, status: "PAID" },
    { id: "ps5", staffName: "Ramesh Kumar",   month: "Mar 2026", grossPaise: 28000_00, deductionsPaise:  3000_00, netPaise: 25000_00, status: "PAID" },
  ],

  achievements: [
    { id: "ach1", studentName: "Vihaan Joshi",  title: "State Cricket U-15 Selection",    date: "2026-03-20", level: "STATE" },
    { id: "ach2", studentName: "Riya Saxena",   title: "Regional Olympiad — Maths Gold",  date: "2026-02-15", level: "REGIONAL" },
    { id: "ach3", studentName: "Ishaan Kapoor", title: "Inter-school Quiz — 1st place",   date: "2026-04-10", level: "DISTRICT" },
    { id: "ach4", studentName: "Aanya Iyer",    title: "Art Competition — Bronze",        date: "2026-01-22", level: "STATE" },
  ],

  certificates: [
    { id: "ct1", student: "Aanya Iyer",      type: "Bonafide",       issuedAt: "2026-04-20" },
    { id: "ct2", student: "Mihir Bose",      type: "Achievement",    issuedAt: "2026-04-18" },
    { id: "ct3", student: "Riya Saxena",     type: "Character",      issuedAt: "2026-04-15" },
    { id: "ct4", student: "Vihaan Joshi",    type: "Achievement",    issuedAt: "2026-04-12" },
  ],

  concerns: [
    { id: "c1", subject: "Bus delayed again on route 4",        category: "TRANSPORT", severity: "HIGH",   raisedBy: "Parent of Aanya Iyer",  status: "OPEN",       createdAt: "2026-04-22" },
    { id: "c2", subject: "Library bulb fused in reading hall",  category: "INFRA",     severity: "LOW",    raisedBy: "Librarian",             status: "IN_PROGRESS",createdAt: "2026-04-23" },
    { id: "c3", subject: "Maths homework explanation unclear",  category: "ACADEMIC",  severity: "MEDIUM", raisedBy: "Parent of Arjun Mehta",  status: "OPEN",       createdAt: "2026-04-24" },
    { id: "c4", subject: "Cafeteria menu repetition",           category: "OTHER",     severity: "LOW",    raisedBy: "Hostel rep",            status: "OPEN",       createdAt: "2026-04-25" },
    { id: "c5", subject: "Sports class needs new cricket bats", category: "OTHER",     severity: "LOW",    raisedBy: "PE coach",              status: "RESOLVED",   createdAt: "2026-04-20" },
  ],

  announcements: [
    { id: "a1", title: "Parent–Teacher Meeting on May 10",     body: "Dear parents, the next PTM is scheduled for Saturday May 10. Slot booking opens on May 4.", date: "2026-04-25" },
    { id: "a2", title: "Sports Day rehearsal — May 6",         body: "All Grade 6–10 students to assemble at 7:30 AM in school uniform. Refreshments will be provided.", date: "2026-04-23" },
    { id: "a3", title: "Library week starts Monday",            body: "Students who return overdue books this week will have their fines waived.", date: "2026-04-22" },
    { id: "a4", title: "Online classes resumed for hostellers", body: "Hostel students will join online classes at 4 PM for revision support.", date: "2026-04-21" },
    { id: "a5", title: "Vaccination drive on April 30",         body: "First aid camp + tetanus booster vaccine for Grade 9 onwards. Please submit consent.", date: "2026-04-19" },
  ],

  attendanceToday: {
    "s1": "PRESENT", "s2": "PRESENT", "s3": "ABSENT", "s4": "PRESENT",
    "s5": "PRESENT", "s6": "LATE", "s7": "PRESENT", "s8": "PRESENT",
    "s9": "PRESENT", "s10": "ABSENT", "s11": "PRESENT", "s12": "PRESENT",
  },

  // ─── AI Insights mini-readouts ───
  ai: {
    leadScores: [
      { name: "Saanvi Pillai", grade: "Grade 3", score: 0.84, band: "HIGH",   reason: "Sibling enrolled · 4 follow-ups · stage=OFFERED" },
      { name: "Inaaya Khan",   grade: "Grade 6", score: 0.92, band: "HIGH",   reason: "Stage=ENROLLED" },
      { name: "Vivaan Roy",    grade: "Grade 5", score: 0.42, band: "MEDIUM", reason: "Source=WEB · 1 follow-up" },
      { name: "Reyansh Goel",  grade: "Grade 2", score: 0.21, band: "LOW",    reason: "No recent contact" },
      { name: "Aarush Bansal", grade: "Grade 4", score: 0.62, band: "MEDIUM", reason: "Referral · stage=VISITED" },
    ],
    atRisk: [
      { name: "Mihir Bose",   class: "Grade 9 — A", risk: 0.78, reason: "Attendance 64% · grades falling" },
      { name: "Aditi Reddy",  class: "Grade 6 — B", risk: 0.61, reason: "Attendance 71% · 2 concerns recently" },
      { name: "Devansh Patel",class: "Grade 7 — B", risk: 0.55, reason: "Fees overdue 32d · attendance falling" },
    ],
    delinquency: [
      { student: "Arjun Mehta",   risk: 0.74, outstanding: 105000_00, overdue: 42 },
      { student: "Devansh Patel", risk: 0.66, outstanding: 115000_00, overdue: 32 },
      { student: "Diya Nair",     risk: 0.41, outstanding:  65000_00, overdue: 18 },
    ],
  },

  // ─── Connect (messaging) credits & history ───
  connect: {
    smsHistory: [
      { id: "m1", to: "All Grade 7 parents", template: "PTM reminder",     sentAt: "2026-04-25 09:00", recipients: 65 },
      { id: "m2", to: "Bus 1 parents",       template: "Bus delay notice", sentAt: "2026-04-22 07:35", recipients: 32 },
      { id: "m3", to: "All staff",           template: "Holiday notice",   sentAt: "2026-04-20 17:00", recipients: 56 },
    ],
  },
};
