-- Self-hosted help video library.

CREATE TABLE "HelpVideo" (
  "id" TEXT NOT NULL,
  "module" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "durationSec" INTEGER NOT NULL DEFAULT 0,
  "videoUrl" TEXT NOT NULL,
  "thumbnailUrl" TEXT,
  "posterColor" TEXT NOT NULL DEFAULT 'brand',
  "sequence" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HelpVideo_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "HelpVideo_module_sequence_idx" ON "HelpVideo"("module","sequence");
CREATE INDEX "HelpVideo_active_idx" ON "HelpVideo"("active");

-- Seed initial library with our 12 tutorials.
-- These rows are placeholders pointing at /videos/<slug>.mp4 — the admin
-- replaces videoUrl after uploading to Storage.
INSERT INTO "HelpVideo" ("id","module","title","description","durationSec","videoUrl","posterColor","sequence")
VALUES
  ('hv01','Admissions','Enquiries → Applications → Admit','Walk through capturing an enquiry, converting to an application, and admitting a student in one transaction.',300,'/videos/admissions-enquiry-to-admit.mp4','blue',1),
  ('hv02','Admissions','Direct admission','When a parent walks in ready to admit, file an application and admit them in a single flow.',180,'/videos/admissions-direct-admission.mp4','blue',2),
  ('hv03','SIS','Year-end student promotion','Promote a class roster with per-student action: pass + promote, financial promotion, detain, alumni, or dropout.',240,'/videos/sis-promotion.mp4','sky',1),
  ('hv04','SIS','PTM scheduling and feedback','Schedule a PTM, track parent attendance, and capture per-student feedback.',180,'/videos/sis-ptm.mp4','sky',2),
  ('hv05','Finance','Fee receipt entry + bank reconciliation','Collect a fee against multiple invoices, generate the receipt PDF, and reconcile the bank statement CSV.',360,'/videos/finance-receipt-recon.mp4','emerald',1),
  ('hv06','Finance','Concession with approval workflow','Request a concession, route it through approvals, and apply it on approval.',180,'/videos/finance-concession.mp4','emerald',2),
  ('hv07','HR','Generate monthly payslips','Pick a month, run payslip generation with attendance-based LOP, and download per-staff PDF.',240,'/videos/hr-payroll.mp4','violet',1),
  ('hv08','Online Exams','Question bank + AI exam draft','Add questions manually, generate questions with AI, and create a draft exam in one click.',300,'/videos/exams-ai-bank.mp4','amber',1),
  ('hv09','Library','Catalogue + issue + barcodes','Catalogue books, issue copies to students, and bulk-print barcode labels.',240,'/videos/library-catalog.mp4','indigo',1),
  ('hv10','Reports','Pre-built + custom builder','Run any of the 10 preset reports and save your own templates with live preview.',180,'/videos/reports-builder.mp4','rose',1),
  ('hv11','Settings','Holiday master + working days','Configure school holidays + working days of the week — used by attendance and monthly working-day calc.',120,'/videos/settings-holidays.mp4','slate',1),
  ('hv12','Connect','Bulk SMS / WhatsApp / Email + drip','Send a one-time campaign to your audience filter and set up multi-step drip campaigns.',240,'/videos/connect-bulk-drip.mp4','cyan',1);
