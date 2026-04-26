-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "logoUrl" TEXT,
    "academicYear" TEXT NOT NULL DEFAULT '2026-2027',
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "School_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "admissionNo" TEXT NOT NULL,
    "rollNo" TEXT NOT NULL,
    "classId" TEXT,
    "section" TEXT,
    "dob" TIMESTAMP(3) NOT NULL,
    "gender" TEXT NOT NULL,
    "bloodGroup" TEXT,
    "address" TEXT NOT NULL,
    "busStopId" TEXT,

    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guardian" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "occupation" TEXT,

    CONSTRAINT "Guardian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuardianStudent" (
    "id" TEXT NOT NULL,
    "guardianId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "GuardianStudent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Staff" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "designation" TEXT NOT NULL,
    "department" TEXT,
    "joiningDate" TIMESTAMP(3) NOT NULL,
    "qualification" TEXT,
    "pan" TEXT,
    "bankAccount" TEXT,
    "ifsc" TEXT,

    CONSTRAINT "Staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Class" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "grade" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "classTeacherId" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'sky',

    CONSTRAINT "Class_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "teacherId" TEXT,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ASSIGNMENT',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "maxPoints" INTEGER NOT NULL DEFAULT 100,
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attachments" TEXT NOT NULL DEFAULT '[]',

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "assignmentId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ASSIGNED',
    "content" TEXT,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "submittedAt" TIMESTAMP(3),
    "grade" INTEGER,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassAttendance" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "remarks" TEXT,
    "markedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BusAttendance" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "routeStopId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "trip" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "scannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedBy" TEXT,

    CONSTRAINT "BusAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bus" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "model" TEXT,
    "routeId" TEXT,
    "driverId" TEXT,
    "conductorId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Bus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Route" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "km" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "Route_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RouteStop" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "pickupTime" TEXT NOT NULL,
    "dropTime" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "RouteStop_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GPSPing" (
    "id" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "speedKmh" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "heading" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GPSPing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeeStructure" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT,
    "name" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "FeeStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "subtotal" INTEGER NOT NULL,
    "discount" INTEGER NOT NULL DEFAULT 0,
    "tax" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "amountPaid" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "feeStructureId" TEXT,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "receiptNo" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "txnRef" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "reorderLevel" INTEGER NOT NULL DEFAULT 0,
    "qtyOnHand" INTEGER NOT NULL DEFAULT 0,
    "unitCost" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockMovement" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "reason" TEXT,
    "ref" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vendor" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "gstin" TEXT,
    "pan" TEXT,
    "address" TEXT,
    "defaultTdsSection" TEXT,

    CONSTRAINT "Vendor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedAt" TIMESTAMP(3),
    "total" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "notes" TEXT,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrderLine" (
    "id" TEXT NOT NULL,
    "poId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "receivedQty" INTEGER NOT NULL DEFAULT 0,
    "unitCost" INTEGER NOT NULL,

    CONSTRAINT "PurchaseOrderLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "basic" INTEGER NOT NULL,
    "hra" INTEGER NOT NULL DEFAULT 0,
    "da" INTEGER NOT NULL DEFAULT 0,
    "special" INTEGER NOT NULL DEFAULT 0,
    "transport" INTEGER NOT NULL DEFAULT 0,
    "pfPct" DOUBLE PRECISION NOT NULL DEFAULT 12.0,
    "esiPct" DOUBLE PRECISION NOT NULL DEFAULT 0.75,
    "tdsMonthly" INTEGER NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "workedDays" INTEGER NOT NULL DEFAULT 30,
    "lopDays" INTEGER NOT NULL DEFAULT 0,
    "basic" INTEGER NOT NULL,
    "hra" INTEGER NOT NULL,
    "da" INTEGER NOT NULL,
    "special" INTEGER NOT NULL,
    "transport" INTEGER NOT NULL,
    "gross" INTEGER NOT NULL,
    "pf" INTEGER NOT NULL,
    "esi" INTEGER NOT NULL,
    "tds" INTEGER NOT NULL,
    "otherDeductions" INTEGER NOT NULL DEFAULT 0,
    "totalDeductions" INTEGER NOT NULL,
    "net" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FINALISED',
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "classId" TEXT,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffAttendance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL,
    "inTime" TIMESTAMP(3),
    "outTime" TIMESTAMP(3),
    "hoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "source" TEXT NOT NULL DEFAULT 'MANUAL',
    "note" TEXT,

    CONSTRAINT "StaffAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3) NOT NULL,
    "days" DOUBLE PRECISION NOT NULL,
    "halfDay" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approverId" TEXT,
    "approverNote" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveBalance" (
    "id" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "granted" DOUBLE PRECISION NOT NULL,
    "used" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "LeaveBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "actorRole" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT,
    "entityId" TEXT,
    "summary" TEXT,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "ip" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MessageOutbox" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "toEmail" TEXT,
    "toPhone" TEXT,
    "toUserId" TEXT,
    "subject" TEXT,
    "body" TEXT NOT NULL,
    "template" TEXT,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "providerRef" TEXT,
    "error" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "queuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "MessageOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "kind" TEXT,
    "ownerEntity" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FileAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaxDeclaration" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "regime" TEXT NOT NULL DEFAULT 'NEW',
    "s80C" INTEGER NOT NULL DEFAULT 0,
    "s80D" INTEGER NOT NULL DEFAULT 0,
    "s80CCD1B" INTEGER NOT NULL DEFAULT 0,
    "hraRentPaid" INTEGER NOT NULL DEFAULT 0,
    "hraMetro" BOOLEAN NOT NULL DEFAULT true,
    "homeLoanInterest" INTEGER NOT NULL DEFAULT 0,
    "otherIncome" INTEGER NOT NULL DEFAULT 0,
    "computedTaxAnnual" INTEGER NOT NULL DEFAULT 0,
    "computedTaxMonthly" INTEGER NOT NULL DEFAULT 0,
    "computedAt" TIMESTAMP(3),

    CONSTRAINT "TaxDeclaration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompliancePeriod" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "month" INTEGER NOT NULL DEFAULT 0,
    "quarter" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "challanRef" TEXT,
    "filedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "tdsChallanId" TEXT,

    CONSTRAINT "CompliancePeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgTaxProfile" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "pan" TEXT,
    "tan" TEXT,
    "gstin" TEXT,
    "cin" TEXT,
    "orgType" TEXT NOT NULL DEFAULT 'TRUST',
    "has12ARegistration" BOOLEAN NOT NULL DEFAULT true,
    "registrationDate12A" TIMESTAMP(3),
    "has80GRegistration" BOOLEAN NOT NULL DEFAULT false,
    "pfEstablishmentCode" TEXT,
    "esicCode" TEXT,
    "ptRegNo" TEXT,
    "bankAccountIfsc" TEXT,
    "bankAccountNo" TEXT,
    "responsiblePersonName" TEXT,
    "responsiblePersonDesignation" TEXT,
    "signatoryPan" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgTaxProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TdsChallan" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "bsrCode" TEXT NOT NULL,
    "challanNo" TEXT NOT NULL,
    "challanDate" TIMESTAMP(3) NOT NULL,
    "amount" INTEGER NOT NULL,
    "bankName" TEXT,
    "section" TEXT,
    "quarter" INTEGER,
    "year" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TdsChallan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VendorTdsDeduction" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "invoiceRef" TEXT,
    "section" TEXT NOT NULL,
    "natureOfPayment" TEXT NOT NULL,
    "grossAmount" INTEGER NOT NULL,
    "tdsRate" DOUBLE PRECISION NOT NULL,
    "tdsAmount" INTEGER NOT NULL,
    "netAmount" INTEGER NOT NULL,
    "panFurnished" BOOLEAN NOT NULL DEFAULT true,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "challanId" TEXT,
    "certificateNo" TEXT,
    "quarter" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "VendorTdsDeduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Form16Issuance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "financialYear" TEXT NOT NULL,
    "partAGenerated" BOOLEAN NOT NULL DEFAULT false,
    "partBGenerated" BOOLEAN NOT NULL DEFAULT true,
    "totalGross" INTEGER NOT NULL,
    "totalDeductions" INTEGER NOT NULL,
    "totalTaxDeducted" INTEGER NOT NULL,
    "certificateNo" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedToEmail" TEXT,
    "issuedAt" TIMESTAMP(3),

    CONSTRAINT "Form16Issuance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimetableEntry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "teacherId" TEXT,
    "dayOfWeek" INTEGER NOT NULL,
    "period" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "room" TEXT,

    CONSTRAINT "TimetableEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exam" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "maxPerSubject" INTEGER NOT NULL DEFAULT 100,
    "passingPct" DOUBLE PRECISION NOT NULL DEFAULT 35.0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Exam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamSubject" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "date" TIMESTAMP(3),
    "startTime" TEXT,
    "endTime" TEXT,
    "maxMarks" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "ExamSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamMark" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "examSubjectId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "marksObtained" INTEGER NOT NULL,
    "grade" TEXT,
    "remarks" TEXT,
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "enteredById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamMark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "isbn" TEXT,
    "title" TEXT NOT NULL,
    "author" TEXT,
    "publisher" TEXT,
    "category" TEXT,
    "language" TEXT NOT NULL DEFAULT 'English',
    "totalCopies" INTEGER NOT NULL DEFAULT 1,
    "availableCopies" INTEGER NOT NULL DEFAULT 1,
    "shelfCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Book_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookCopy" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',

    CONSTRAINT "BookCopy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookIssue" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "copyId" TEXT NOT NULL,
    "studentId" TEXT,
    "staffId" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnedAt" TIMESTAMP(3),
    "fineAmount" INTEGER NOT NULL DEFAULT 0,
    "finePaid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "BookIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolEvent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'EVENT',
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "classId" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SchoolEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdmissionEnquiry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "childName" TEXT NOT NULL,
    "childDob" TIMESTAMP(3),
    "childGender" TEXT,
    "expectedGrade" TEXT NOT NULL,
    "parentName" TEXT NOT NULL,
    "parentPhone" TEXT NOT NULL,
    "parentEmail" TEXT,
    "source" TEXT NOT NULL,
    "subSource" TEXT,
    "campaign" TEXT,
    "preferredBranch" TEXT,
    "followUpAt" TIMESTAMP(3),
    "counselorId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ENQUIRY',
    "applicationFee" INTEGER NOT NULL DEFAULT 0,
    "feePaid" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "lostReason" TEXT,
    "enrolledStudentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdmissionEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnquiryInteraction" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "byUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnquiryInteraction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitPurpose" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "needsOtp" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VisitPurpose_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitorBan" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "reason" TEXT NOT NULL,
    "bannedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bannedById" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "VisitorBan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Visitor" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "photoUrl" TEXT,
    "purpose" TEXT NOT NULL,
    "hostUserId" TEXT,
    "hostName" TEXT,
    "vehicleNo" TEXT,
    "idProofType" TEXT,
    "idProofNo" TEXT,
    "badgeNo" TEXT,
    "inAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "outAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN',
    "preRegId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Visitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PreRegisteredVisitor" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "hostName" TEXT NOT NULL,
    "expectedAt" TIMESTAMP(3) NOT NULL,
    "qrCode" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PreRegisteredVisitor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelBuilding" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "wardenId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "HostelBuilding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelFloor" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "HostelFloor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelRoom" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "floorId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STANDARD',
    "capacity" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "HostelRoom_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelBed" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'VACANT',

    CONSTRAINT "HostelBed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HostelAllotment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "bedId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL,
    "toDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "monthlyRent" INTEGER NOT NULL DEFAULT 0,
    "securityDeposit" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HostelAllotment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealPlan" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "meal" TEXT NOT NULL,
    "menu" TEXT NOT NULL,

    CONSTRAINT "MealPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MealAttendance" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "meal" TEXT NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MealAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Outpass" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromAt" TIMESTAMP(3) NOT NULL,
    "toAt" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "approverId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Outpass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concern" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "raisedById" TEXT,
    "raisedByName" TEXT NOT NULL,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "ownerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "slaDueAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "resolution" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Concern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorMapping" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fromDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "toDate" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MentorMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorMeeting" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "mentorId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "meetingAt" TIMESTAMP(3) NOT NULL,
    "agenda" TEXT NOT NULL,
    "notes" TEXT,
    "actionItems" TEXT,
    "followUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MentorMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementOpportunity" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "eligibility" TEXT,
    "location" TEXT,
    "applyBy" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementApplication" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'APPLIED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlacementApplication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "studentId" TEXT,
    "staffId" TEXT,
    "level" TEXT,
    "position" TEXT,
    "awardedAt" TIMESTAMP(3) NOT NULL,
    "certificateUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Achievement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlineExam" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "title" TEXT NOT NULL,
    "flavor" TEXT NOT NULL DEFAULT 'OBJECTIVE',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "passMarks" INTEGER NOT NULL,
    "negativeMark" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 1,
    "shuffle" BOOLEAN NOT NULL DEFAULT true,
    "webcam" BOOLEAN NOT NULL DEFAULT false,
    "tabSwitchDetect" BOOLEAN NOT NULL DEFAULT false,
    "publishMode" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnlineExam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlineQuestion" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MCQ',
    "options" TEXT NOT NULL DEFAULT '[]',
    "correct" TEXT NOT NULL DEFAULT '[]',
    "marks" INTEGER NOT NULL DEFAULT 1,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "OnlineQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlineExamAttempt" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "attemptNo" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "scoreObtained" INTEGER NOT NULL DEFAULT 0,
    "tabSwitches" INTEGER NOT NULL DEFAULT 0,
    "responses" TEXT NOT NULL DEFAULT '{}',
    "flagged" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "OnlineExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConcessionType" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ConcessionType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentConcession" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "typeId" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "pct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "approverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudentConcession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scholarship" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" INTEGER NOT NULL DEFAULT 0,
    "eligibility" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Scholarship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScholarshipAward" (
    "id" TEXT NOT NULL,
    "scholarshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "awardedOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SANCTIONED',
    "notes" TEXT,

    CONSTRAINT "ScholarshipAward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "signatory" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CertificateTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CertificateIssue" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "studentId" TEXT,
    "staffId" TEXT,
    "serialNo" TEXT NOT NULL,
    "templateId" TEXT,
    "data" TEXT NOT NULL DEFAULT '{}',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "issuedById" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ISSUED',
    "pdfUrl" TEXT,
    "qrToken" TEXT,

    CONSTRAINT "CertificateIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiaryEntry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "homework" TEXT,
    "postedById" TEXT,
    "postedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiaryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoAlbum" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "classId" TEXT,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "watermark" BOOLEAN NOT NULL DEFAULT true,
    "downloadAllowed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoAlbum_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Photo" (
    "id" TEXT NOT NULL,
    "albumId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseHead" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ExpenseHead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "voucherNo" TEXT NOT NULL,
    "headName" TEXT NOT NULL,
    "vendorId" TEXT,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "approverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "attachmentUrl" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BudgetLine" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "fy" TEXT NOT NULL,
    "costCenter" TEXT,
    "headName" TEXT NOT NULL,
    "plannedAmount" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "BudgetLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "price" INTEGER NOT NULL,
    "isVeg" BOOLEAN NOT NULL DEFAULT true,
    "available" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "CanteenItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenWallet" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT,
    "staffId" TEXT,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "rfidTag" TEXT,

    CONSTRAINT "CanteenWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CanteenTransaction" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "itemSnapshot" TEXT,
    "balance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CanteenTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "qtyOnHand" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "StoreItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StoreSale" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "studentId" TEXT,
    "itemSnapshot" TEXT NOT NULL,
    "total" INTEGER NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
    "refunded" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StoreSale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicForm" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'ALL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicForm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicFormSubmission" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "submittedById" TEXT,
    "data" TEXT NOT NULL,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DynamicFormSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoginEvent" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "ip" TEXT,
    "userAgent" TEXT,
    "device" TEXT,
    "loggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoginEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeachingPlan" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "weekNo" INTEGER NOT NULL,
    "outcomes" TEXT,
    "resources" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "pacingNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeachingPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnlineClass" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'ZOOM',
    "joinUrl" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 45,
    "recordingUrl" TEXT,
    "hostId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnlineClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentItem" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT,
    "subjectId" TEXT,
    "chapter" TEXT,
    "topic" TEXT,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "copyright" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NEPHPCEntry" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "descriptor" TEXT NOT NULL,
    "rubricLevel" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NEPHPCEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassObservation" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "observerId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "rubric" TEXT NOT NULL,
    "feedback" TEXT,
    "actionPlan" TEXT,
    "followUpAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassObservation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectCampaign" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "templateId" TEXT,
    "body" TEXT NOT NULL,
    "audienceFilter" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "delivered" INTEGER NOT NULL DEFAULT 0,
    "failed" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectCampaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectTemplate" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "category" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConnectProvider" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "senderId" TEXT,
    "dltEntityId" TEXT,
    "apiKey" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConnectProvider_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryCategory" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LibraryCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryPublisher" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact" TEXT,
    "email" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LibraryPublisher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryReturnDays" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "memberType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "days" INTEGER NOT NULL,
    "graceDays" INTEGER NOT NULL DEFAULT 0,
    "excludeWeekends" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "LibraryReturnDays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryMaximumBooks" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "memberType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "maxBooks" INTEGER NOT NULL,
    "classId" TEXT,

    CONSTRAINT "LibraryMaximumBooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryFineRule" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "daysFrom" INTEGER NOT NULL,
    "daysTo" INTEGER NOT NULL,
    "amountPerDay" INTEGER NOT NULL DEFAULT 0,
    "flatAmount" INTEGER NOT NULL DEFAULT 0,
    "capAmount" INTEGER NOT NULL DEFAULT 0,
    "waiverAllowed" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LibraryFineRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LexileGradeRange" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "minLexile" INTEGER NOT NULL,
    "maxLexile" INTEGER NOT NULL,

    CONSTRAINT "LexileGradeRange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LexileBand" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "minLexile" INTEGER NOT NULL,
    "maxLexile" INTEGER NOT NULL,

    CONSTRAINT "LexileBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LibraryAssessment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "conductedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scores" TEXT NOT NULL,
    "computedLexile" INTEGER NOT NULL DEFAULT 0,
    "band" TEXT,
    "recommendation" TEXT,
    "conductedBy" TEXT,

    CONSTRAINT "LibraryAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleDoc" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "busId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3) NOT NULL,
    "fileUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "VehicleDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffDoc" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "staffId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" TEXT,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "fileUrl" TEXT,
    "notes" TEXT,

    CONSTRAINT "StaffDoc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WallPost" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'STAFF',
    "body" TEXT NOT NULL,
    "attachments" TEXT NOT NULL DEFAULT '[]',
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WallPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WallComment" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WallComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectMaster" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "hasTheory" BOOLEAN NOT NULL DEFAULT true,
    "hasPractical" BOOLEAN NOT NULL DEFAULT false,
    "creditHours" INTEGER NOT NULL DEFAULT 4,
    "boardCsv" TEXT NOT NULL DEFAULT 'CBSE',

    CONSTRAINT "SubjectMaster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningTaxonomy" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "levelsCsv" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "LearningTaxonomy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reflection" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorRole" TEXT NOT NULL,
    "mood" TEXT,
    "title" TEXT,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BaselineAssessment" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'PRE',
    "conductedAt" TIMESTAMP(3) NOT NULL,
    "scores" TEXT NOT NULL,
    "totalMarks" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "BaselineAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refEntity" TEXT,
    "refId" TEXT,
    "summary" TEXT NOT NULL,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "requestedById" TEXT,
    "approverId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FavouriteMenu" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FavouriteMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiInsight" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refEntity" TEXT,
    "refId" TEXT,
    "score" DOUBLE PRECISION,
    "band" TEXT,
    "reason" TEXT,
    "payload" TEXT NOT NULL DEFAULT '{}',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiInsight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiSuggestion" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "refEntity" TEXT,
    "refId" TEXT,
    "prompt" TEXT NOT NULL,
    "output" TEXT NOT NULL,
    "meta" TEXT NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "authorId" TEXT,
    "reviewerId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiSuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiAuditLog" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT,
    "feature" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "tokensIn" INTEGER NOT NULL DEFAULT 0,
    "tokensOut" INTEGER NOT NULL DEFAULT 0,
    "latencyMs" INTEGER NOT NULL DEFAULT 0,
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "errorMsg" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiEmbedding" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "refEntity" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "vector" TEXT NOT NULL,
    "dim" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiEmbedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCompatibility" (
    "id" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "studentAId" TEXT NOT NULL,
    "studentBId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "reasons" TEXT NOT NULL DEFAULT '[]',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "School_code_key" ON "School"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_schoolId_idx" ON "User"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE INDEX "Student_schoolId_classId_idx" ON "Student"("schoolId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_schoolId_admissionNo_key" ON "Student"("schoolId", "admissionNo");

-- CreateIndex
CREATE UNIQUE INDEX "Guardian_userId_key" ON "Guardian"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuardianStudent_guardianId_studentId_key" ON "GuardianStudent"("guardianId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_userId_key" ON "Staff"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Staff_schoolId_employeeId_key" ON "Staff"("schoolId", "employeeId");

-- CreateIndex
CREATE INDEX "Class_schoolId_idx" ON "Class"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Class_schoolId_grade_section_key" ON "Class"("schoolId", "grade", "section");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_classId_code_key" ON "Subject"("classId", "code");

-- CreateIndex
CREATE INDEX "Assignment_classId_idx" ON "Assignment"("classId");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_assignmentId_studentId_key" ON "Submission"("assignmentId", "studentId");

-- CreateIndex
CREATE INDEX "ClassAttendance_date_idx" ON "ClassAttendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ClassAttendance_classId_studentId_date_key" ON "ClassAttendance"("classId", "studentId", "date");

-- CreateIndex
CREATE INDEX "BusAttendance_studentId_date_idx" ON "BusAttendance"("studentId", "date");

-- CreateIndex
CREATE INDEX "BusAttendance_busId_date_idx" ON "BusAttendance"("busId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Bus_routeId_key" ON "Bus"("routeId");

-- CreateIndex
CREATE UNIQUE INDEX "Bus_schoolId_number_key" ON "Bus"("schoolId", "number");

-- CreateIndex
CREATE INDEX "RouteStop_routeId_sequence_idx" ON "RouteStop"("routeId", "sequence");

-- CreateIndex
CREATE INDEX "GPSPing_busId_capturedAt_idx" ON "GPSPing"("busId", "capturedAt");

-- CreateIndex
CREATE INDEX "Invoice_studentId_idx" ON "Invoice"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_schoolId_number_key" ON "Invoice"("schoolId", "number");

-- CreateIndex
CREATE INDEX "Payment_schoolId_paidAt_idx" ON "Payment"("schoolId", "paidAt");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_schoolId_receiptNo_key" ON "Payment"("schoolId", "receiptNo");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_schoolId_sku_key" ON "InventoryItem"("schoolId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_schoolId_number_key" ON "PurchaseOrder"("schoolId", "number");

-- CreateIndex
CREATE INDEX "SalaryStructure_staffId_idx" ON "SalaryStructure"("staffId");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_staffId_month_year_key" ON "Payslip"("staffId", "month", "year");

-- CreateIndex
CREATE INDEX "Announcement_schoolId_createdAt_idx" ON "Announcement"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "StaffAttendance_date_idx" ON "StaffAttendance"("date");

-- CreateIndex
CREATE UNIQUE INDEX "StaffAttendance_staffId_date_key" ON "StaffAttendance"("staffId", "date");

-- CreateIndex
CREATE INDEX "LeaveRequest_staffId_status_idx" ON "LeaveRequest"("staffId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LeaveBalance_staffId_year_type_key" ON "LeaveBalance"("staffId", "year", "type");

-- CreateIndex
CREATE INDEX "AuditLog_schoolId_createdAt_idx" ON "AuditLog"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_entity_entityId_idx" ON "AuditLog"("entity", "entityId");

-- CreateIndex
CREATE INDEX "MessageOutbox_schoolId_status_queuedAt_idx" ON "MessageOutbox"("schoolId", "status", "queuedAt");

-- CreateIndex
CREATE INDEX "FileAsset_schoolId_idx" ON "FileAsset"("schoolId");

-- CreateIndex
CREATE INDEX "FileAsset_ownerEntity_ownerId_idx" ON "FileAsset"("ownerEntity", "ownerId");

-- CreateIndex
CREATE INDEX "TaxDeclaration_schoolId_idx" ON "TaxDeclaration"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TaxDeclaration_staffId_financialYear_key" ON "TaxDeclaration"("staffId", "financialYear");

-- CreateIndex
CREATE INDEX "CompliancePeriod_schoolId_dueDate_status_idx" ON "CompliancePeriod"("schoolId", "dueDate", "status");

-- CreateIndex
CREATE UNIQUE INDEX "CompliancePeriod_schoolId_type_month_quarter_year_key" ON "CompliancePeriod"("schoolId", "type", "month", "quarter", "year");

-- CreateIndex
CREATE UNIQUE INDEX "OrgTaxProfile_schoolId_key" ON "OrgTaxProfile"("schoolId");

-- CreateIndex
CREATE INDEX "TdsChallan_schoolId_year_type_idx" ON "TdsChallan"("schoolId", "year", "type");

-- CreateIndex
CREATE UNIQUE INDEX "TdsChallan_schoolId_bsrCode_challanNo_challanDate_key" ON "TdsChallan"("schoolId", "bsrCode", "challanNo", "challanDate");

-- CreateIndex
CREATE INDEX "VendorTdsDeduction_schoolId_year_quarter_idx" ON "VendorTdsDeduction"("schoolId", "year", "quarter");

-- CreateIndex
CREATE INDEX "VendorTdsDeduction_vendorId_idx" ON "VendorTdsDeduction"("vendorId");

-- CreateIndex
CREATE UNIQUE INDEX "Form16Issuance_staffId_financialYear_key" ON "Form16Issuance"("staffId", "financialYear");

-- CreateIndex
CREATE INDEX "TimetableEntry_teacherId_dayOfWeek_idx" ON "TimetableEntry"("teacherId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "TimetableEntry_schoolId_idx" ON "TimetableEntry"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "TimetableEntry_classId_dayOfWeek_period_key" ON "TimetableEntry"("classId", "dayOfWeek", "period");

-- CreateIndex
CREATE UNIQUE INDEX "Exam_schoolId_classId_name_key" ON "Exam"("schoolId", "classId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ExamSubject_examId_subjectId_key" ON "ExamSubject"("examId", "subjectId");

-- CreateIndex
CREATE INDEX "ExamMark_studentId_idx" ON "ExamMark"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExamMark_examSubjectId_studentId_key" ON "ExamMark"("examSubjectId", "studentId");

-- CreateIndex
CREATE INDEX "Book_schoolId_idx" ON "Book"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "BookCopy_barcode_key" ON "BookCopy"("barcode");

-- CreateIndex
CREATE INDEX "BookIssue_schoolId_returnedAt_idx" ON "BookIssue"("schoolId", "returnedAt");

-- CreateIndex
CREATE INDEX "SchoolEvent_schoolId_startsAt_idx" ON "SchoolEvent"("schoolId", "startsAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Branch_schoolId_idx" ON "Branch"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_schoolId_code_key" ON "Branch"("schoolId", "code");

-- CreateIndex
CREATE INDEX "AdmissionEnquiry_schoolId_status_idx" ON "AdmissionEnquiry"("schoolId", "status");

-- CreateIndex
CREATE INDEX "AdmissionEnquiry_schoolId_source_idx" ON "AdmissionEnquiry"("schoolId", "source");

-- CreateIndex
CREATE INDEX "EnquiryInteraction_enquiryId_idx" ON "EnquiryInteraction"("enquiryId");

-- CreateIndex
CREATE UNIQUE INDEX "VisitPurpose_schoolId_name_key" ON "VisitPurpose"("schoolId", "name");

-- CreateIndex
CREATE INDEX "VisitorBan_schoolId_phone_idx" ON "VisitorBan"("schoolId", "phone");

-- CreateIndex
CREATE INDEX "Visitor_schoolId_inAt_idx" ON "Visitor"("schoolId", "inAt");

-- CreateIndex
CREATE INDEX "Visitor_schoolId_status_idx" ON "Visitor"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PreRegisteredVisitor_qrCode_key" ON "PreRegisteredVisitor"("qrCode");

-- CreateIndex
CREATE INDEX "PreRegisteredVisitor_schoolId_expectedAt_idx" ON "PreRegisteredVisitor"("schoolId", "expectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "HostelBuilding_schoolId_name_key" ON "HostelBuilding"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "HostelFloor_buildingId_number_key" ON "HostelFloor"("buildingId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "HostelRoom_buildingId_number_key" ON "HostelRoom"("buildingId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "HostelBed_roomId_label_key" ON "HostelBed"("roomId", "label");

-- CreateIndex
CREATE INDEX "HostelAllotment_schoolId_status_idx" ON "HostelAllotment"("schoolId", "status");

-- CreateIndex
CREATE INDEX "HostelAllotment_studentId_idx" ON "HostelAllotment"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "MealPlan_buildingId_dayOfWeek_meal_key" ON "MealPlan"("buildingId", "dayOfWeek", "meal");

-- CreateIndex
CREATE INDEX "MealAttendance_schoolId_date_idx" ON "MealAttendance"("schoolId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "MealAttendance_studentId_date_meal_key" ON "MealAttendance"("studentId", "date", "meal");

-- CreateIndex
CREATE INDEX "Outpass_schoolId_status_idx" ON "Outpass"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Outpass_studentId_idx" ON "Outpass"("studentId");

-- CreateIndex
CREATE INDEX "Concern_schoolId_status_idx" ON "Concern"("schoolId", "status");

-- CreateIndex
CREATE INDEX "Concern_schoolId_createdAt_idx" ON "Concern"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "MentorMapping_schoolId_idx" ON "MentorMapping"("schoolId");

-- CreateIndex
CREATE UNIQUE INDEX "MentorMapping_mentorId_studentId_fromDate_key" ON "MentorMapping"("mentorId", "studentId", "fromDate");

-- CreateIndex
CREATE INDEX "MentorMeeting_schoolId_meetingAt_idx" ON "MentorMeeting"("schoolId", "meetingAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlacementApplication_opportunityId_studentId_key" ON "PlacementApplication"("opportunityId", "studentId");

-- CreateIndex
CREATE INDEX "Achievement_schoolId_awardedAt_idx" ON "Achievement"("schoolId", "awardedAt");

-- CreateIndex
CREATE INDEX "OnlineExam_schoolId_startAt_idx" ON "OnlineExam"("schoolId", "startAt");

-- CreateIndex
CREATE INDEX "OnlineQuestion_examId_idx" ON "OnlineQuestion"("examId");

-- CreateIndex
CREATE INDEX "OnlineExamAttempt_studentId_idx" ON "OnlineExamAttempt"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "OnlineExamAttempt_examId_studentId_attemptNo_key" ON "OnlineExamAttempt"("examId", "studentId", "attemptNo");

-- CreateIndex
CREATE UNIQUE INDEX "ConcessionType_schoolId_name_key" ON "ConcessionType"("schoolId", "name");

-- CreateIndex
CREATE INDEX "StudentConcession_schoolId_status_idx" ON "StudentConcession"("schoolId", "status");

-- CreateIndex
CREATE INDEX "StudentConcession_studentId_idx" ON "StudentConcession"("studentId");

-- CreateIndex
CREATE INDEX "ScholarshipAward_studentId_idx" ON "ScholarshipAward"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateTemplate_schoolId_type_name_key" ON "CertificateTemplate"("schoolId", "type", "name");

-- CreateIndex
CREATE INDEX "CertificateIssue_schoolId_issuedAt_idx" ON "CertificateIssue"("schoolId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "CertificateIssue_schoolId_type_serialNo_key" ON "CertificateIssue"("schoolId", "type", "serialNo");

-- CreateIndex
CREATE INDEX "DiaryEntry_schoolId_postedAt_idx" ON "DiaryEntry"("schoolId", "postedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExpenseHead_schoolId_name_key" ON "ExpenseHead"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Expense_schoolId_expenseDate_idx" ON "Expense"("schoolId", "expenseDate");

-- CreateIndex
CREATE UNIQUE INDEX "Expense_schoolId_voucherNo_key" ON "Expense"("schoolId", "voucherNo");

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLine_schoolId_fy_costCenter_headName_key" ON "BudgetLine"("schoolId", "fy", "costCenter", "headName");

-- CreateIndex
CREATE UNIQUE INDEX "CanteenItem_schoolId_name_key" ON "CanteenItem"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "CanteenWallet_schoolId_studentId_key" ON "CanteenWallet"("schoolId", "studentId");

-- CreateIndex
CREATE UNIQUE INDEX "CanteenWallet_schoolId_staffId_key" ON "CanteenWallet"("schoolId", "staffId");

-- CreateIndex
CREATE INDEX "CanteenTransaction_schoolId_createdAt_idx" ON "CanteenTransaction"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoreItem_schoolId_sku_key" ON "StoreItem"("schoolId", "sku");

-- CreateIndex
CREATE INDEX "StoreSale_schoolId_createdAt_idx" ON "StoreSale"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "StoreSale_schoolId_receiptNo_key" ON "StoreSale"("schoolId", "receiptNo");

-- CreateIndex
CREATE INDEX "DynamicFormSubmission_formId_idx" ON "DynamicFormSubmission"("formId");

-- CreateIndex
CREATE INDEX "LoginEvent_schoolId_loggedAt_idx" ON "LoginEvent"("schoolId", "loggedAt");

-- CreateIndex
CREATE INDEX "LoginEvent_userId_loggedAt_idx" ON "LoginEvent"("userId", "loggedAt");

-- CreateIndex
CREATE INDEX "TeachingPlan_schoolId_classId_idx" ON "TeachingPlan"("schoolId", "classId");

-- CreateIndex
CREATE INDEX "OnlineClass_schoolId_scheduledAt_idx" ON "OnlineClass"("schoolId", "scheduledAt");

-- CreateIndex
CREATE INDEX "ContentItem_schoolId_classId_idx" ON "ContentItem"("schoolId", "classId");

-- CreateIndex
CREATE INDEX "NEPHPCEntry_schoolId_studentId_idx" ON "NEPHPCEntry"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "ClassObservation_schoolId_observedAt_idx" ON "ClassObservation"("schoolId", "observedAt");

-- CreateIndex
CREATE INDEX "ConnectCampaign_schoolId_status_idx" ON "ConnectCampaign"("schoolId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ConnectTemplate_schoolId_channel_name_key" ON "ConnectTemplate"("schoolId", "channel", "name");

-- CreateIndex
CREATE INDEX "ConnectProvider_schoolId_channel_idx" ON "ConnectProvider"("schoolId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryCategory_schoolId_name_key" ON "LibraryCategory"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryPublisher_schoolId_name_key" ON "LibraryPublisher"("schoolId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryReturnDays_schoolId_memberType_category_key" ON "LibraryReturnDays"("schoolId", "memberType", "category");

-- CreateIndex
CREATE UNIQUE INDEX "LibraryMaximumBooks_schoolId_memberType_category_classId_key" ON "LibraryMaximumBooks"("schoolId", "memberType", "category", "classId");

-- CreateIndex
CREATE INDEX "LibraryFineRule_schoolId_category_idx" ON "LibraryFineRule"("schoolId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "LexileGradeRange_schoolId_classId_key" ON "LexileGradeRange"("schoolId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "LexileBand_schoolId_label_key" ON "LexileBand"("schoolId", "label");

-- CreateIndex
CREATE INDEX "LibraryAssessment_schoolId_studentId_idx" ON "LibraryAssessment"("schoolId", "studentId");

-- CreateIndex
CREATE INDEX "VehicleDoc_schoolId_busId_validTo_idx" ON "VehicleDoc"("schoolId", "busId", "validTo");

-- CreateIndex
CREATE INDEX "StaffDoc_schoolId_staffId_idx" ON "StaffDoc"("schoolId", "staffId");

-- CreateIndex
CREATE INDEX "WallPost_schoolId_createdAt_idx" ON "WallPost"("schoolId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectMaster_schoolId_code_key" ON "SubjectMaster"("schoolId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "LearningTaxonomy_schoolId_name_key" ON "LearningTaxonomy"("schoolId", "name");

-- CreateIndex
CREATE INDEX "Reflection_schoolId_authorId_idx" ON "Reflection"("schoolId", "authorId");

-- CreateIndex
CREATE INDEX "BaselineAssessment_schoolId_classId_idx" ON "BaselineAssessment"("schoolId", "classId");

-- CreateIndex
CREATE INDEX "ApprovalRequest_schoolId_status_idx" ON "ApprovalRequest"("schoolId", "status");

-- CreateIndex
CREATE INDEX "ApprovalRequest_schoolId_kind_idx" ON "ApprovalRequest"("schoolId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "FavouriteMenu_userId_href_key" ON "FavouriteMenu"("userId", "href");

-- CreateIndex
CREATE INDEX "AiInsight_schoolId_kind_idx" ON "AiInsight"("schoolId", "kind");

-- CreateIndex
CREATE INDEX "AiInsight_refEntity_refId_idx" ON "AiInsight"("refEntity", "refId");

-- CreateIndex
CREATE INDEX "AiSuggestion_schoolId_kind_status_idx" ON "AiSuggestion"("schoolId", "kind", "status");

-- CreateIndex
CREATE INDEX "AiAuditLog_schoolId_feature_idx" ON "AiAuditLog"("schoolId", "feature");

-- CreateIndex
CREATE INDEX "AiAuditLog_schoolId_createdAt_idx" ON "AiAuditLog"("schoolId", "createdAt");

-- CreateIndex
CREATE INDEX "AiEmbedding_schoolId_refEntity_idx" ON "AiEmbedding"("schoolId", "refEntity");

-- CreateIndex
CREATE UNIQUE INDEX "AiEmbedding_schoolId_refEntity_refId_key" ON "AiEmbedding"("schoolId", "refEntity", "refId");

-- CreateIndex
CREATE INDEX "AiCompatibility_schoolId_studentAId_idx" ON "AiCompatibility"("schoolId", "studentAId");

-- CreateIndex
CREATE UNIQUE INDEX "AiCompatibility_schoolId_studentAId_studentBId_key" ON "AiCompatibility"("schoolId", "studentAId", "studentBId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Student" ADD CONSTRAINT "Student_busStopId_fkey" FOREIGN KEY ("busStopId") REFERENCES "RouteStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guardian" ADD CONSTRAINT "Guardian_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianStudent" ADD CONSTRAINT "GuardianStudent_guardianId_fkey" FOREIGN KEY ("guardianId") REFERENCES "Guardian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuardianStudent" ADD CONSTRAINT "GuardianStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Staff" ADD CONSTRAINT "Staff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Class" ADD CONSTRAINT "Class_classTeacherId_fkey" FOREIGN KEY ("classTeacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_assignmentId_fkey" FOREIGN KEY ("assignmentId") REFERENCES "Assignment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassAttendance" ADD CONSTRAINT "ClassAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusAttendance" ADD CONSTRAINT "BusAttendance_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusAttendance" ADD CONSTRAINT "BusAttendance_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BusAttendance" ADD CONSTRAINT "BusAttendance_routeStopId_fkey" FOREIGN KEY ("routeStopId") REFERENCES "RouteStop"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bus" ADD CONSTRAINT "Bus_conductorId_fkey" FOREIGN KEY ("conductorId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Route" ADD CONSTRAINT "Route_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RouteStop" ADD CONSTRAINT "RouteStop_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "Route"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GPSPing" ADD CONSTRAINT "GPSPing_busId_fkey" FOREIGN KEY ("busId") REFERENCES "Bus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeeStructure" ADD CONSTRAINT "FeeStructure_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_feeStructureId_fkey" FOREIGN KEY ("feeStructureId") REFERENCES "FeeStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vendor" ADD CONSTRAINT "Vendor_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_poId_fkey" FOREIGN KEY ("poId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrderLine" ADD CONSTRAINT "PurchaseOrderLine_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryStructure" ADD CONSTRAINT "SalaryStructure_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Announcement" ADD CONSTRAINT "Announcement_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffAttendance" ADD CONSTRAINT "StaffAttendance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_approverId_fkey" FOREIGN KEY ("approverId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveBalance" ADD CONSTRAINT "LeaveBalance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompliancePeriod" ADD CONSTRAINT "CompliancePeriod_tdsChallanId_fkey" FOREIGN KEY ("tdsChallanId") REFERENCES "TdsChallan"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorTdsDeduction" ADD CONSTRAINT "VendorTdsDeduction_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "Vendor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form16Issuance" ADD CONSTRAINT "Form16Issuance_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimetableEntry" ADD CONSTRAINT "TimetableEntry_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exam" ADD CONSTRAINT "Exam_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubject" ADD CONSTRAINT "ExamSubject_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamSubject" ADD CONSTRAINT "ExamSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_examSubjectId_fkey" FOREIGN KEY ("examSubjectId") REFERENCES "ExamSubject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamMark" ADD CONSTRAINT "ExamMark_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookCopy" ADD CONSTRAINT "BookCopy_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_copyId_fkey" FOREIGN KEY ("copyId") REFERENCES "BookCopy"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookIssue" ADD CONSTRAINT "BookIssue_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "Staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolEvent" ADD CONSTRAINT "SchoolEvent_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnquiryInteraction" ADD CONSTRAINT "EnquiryInteraction_enquiryId_fkey" FOREIGN KEY ("enquiryId") REFERENCES "AdmissionEnquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visitor" ADD CONSTRAINT "Visitor_preRegId_fkey" FOREIGN KEY ("preRegId") REFERENCES "PreRegisteredVisitor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelFloor" ADD CONSTRAINT "HostelFloor_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "HostelBuilding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRoom" ADD CONSTRAINT "HostelRoom_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "HostelBuilding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelRoom" ADD CONSTRAINT "HostelRoom_floorId_fkey" FOREIGN KEY ("floorId") REFERENCES "HostelFloor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelBed" ADD CONSTRAINT "HostelBed_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "HostelBuilding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelBed" ADD CONSTRAINT "HostelBed_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "HostelRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllotment" ADD CONSTRAINT "HostelAllotment_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "HostelBuilding"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HostelAllotment" ADD CONSTRAINT "HostelAllotment_bedId_fkey" FOREIGN KEY ("bedId") REFERENCES "HostelBed"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MealPlan" ADD CONSTRAINT "MealPlan_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "HostelBuilding"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementApplication" ADD CONSTRAINT "PlacementApplication_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "PlacementOpportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineQuestion" ADD CONSTRAINT "OnlineQuestion_examId_fkey" FOREIGN KEY ("examId") REFERENCES "OnlineExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnlineExamAttempt" ADD CONSTRAINT "OnlineExamAttempt_examId_fkey" FOREIGN KEY ("examId") REFERENCES "OnlineExam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScholarshipAward" ADD CONSTRAINT "ScholarshipAward_scholarshipId_fkey" FOREIGN KEY ("scholarshipId") REFERENCES "Scholarship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Photo" ADD CONSTRAINT "Photo_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "PhotoAlbum"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicFormSubmission" ADD CONSTRAINT "DynamicFormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "DynamicForm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WallComment" ADD CONSTRAINT "WallComment_postId_fkey" FOREIGN KEY ("postId") REFERENCES "WallPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
