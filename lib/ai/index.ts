export * from "./util";
export * from "./provider";
export * from "./embeddings";
export * from "./scoring";
export * from "./audit";

// Catalog of all AI features (used by the /Home/AI landing and the
// module sub-nav). Single source of truth so adding/removing a feature
// only requires editing this list.
export type AiFeatureGroup =
  | "Admissions" | "SIS" | "HR" | "Finance" | "Transport"
  | "Library" | "LMS" | "Connect" | "Hostel" | "Cross";

export type AiFeature = {
  href: string;
  label: string;
  group: AiFeatureGroup;
  desc: string;
  needsLLM?: boolean;
};

export const AI_FEATURES: AiFeature[] = [
  // Admissions
  { href: "/Home/AI/lead-scoring",      label: "Lead Scoring",            group: "Admissions", desc: "Rank enquiries by conversion probability." },
  { href: "/Home/AI/follow-up",         label: "Follow-up Coach",         group: "Admissions", desc: "Suggest the next contact + tone.", needsLLM: true },
  // SIS
  { href: "/Home/AI/at-risk",           label: "At-risk Early Warning",   group: "SIS", desc: "Students whose attendance + grades + concerns are slipping." },
  { href: "/Home/AI/learning-gaps",     label: "Learning Gaps",           group: "SIS", desc: "Topic-level diagnostics from exam responses." },
  { href: "/Home/AI/hpc-narrative",     label: "HPC Narrative Drafts",    group: "SIS", desc: "Draft NEP HPC narratives for teachers to review.", needsLLM: true },
  { href: "/Home/AI/adaptive",          label: "Adaptive Practice",       group: "SIS", desc: "Per-student question recommendations." },
  // HR
  { href: "/Home/AI/biometric-anomaly", label: "Biometric Anomalies",     group: "HR", desc: "Flag suspicious punch patterns." },
  { href: "/Home/AI/resume-parser",     label: "Resume Parser",           group: "HR", desc: "Extract structured fields from a CV.", needsLLM: true },
  { href: "/Home/AI/leave-forecast",    label: "Leave Forecast",          group: "HR", desc: "Project next-week staffing gaps." },
  // Finance
  { href: "/Home/AI/fee-delinquency",   label: "Fee Delinquency",         group: "Finance", desc: "Risk score per family + suggested action." },
  { href: "/Home/AI/expense-ocr",       label: "Expense OCR",             group: "Finance", desc: "Extract line items from a receipt.", needsLLM: true },
  { href: "/Home/AI/concession-rec",    label: "Concession Recommender",  group: "Finance", desc: "Suggest concession % from similar profiles." },
  // Transport
  { href: "/Home/AI/eta-prediction",    label: "Bus ETA Prediction",      group: "Transport", desc: "Live ETA from GPS history." },
  { href: "/Home/AI/driver-score",      label: "Driver Behaviour Score",  group: "Transport", desc: "Harsh braking / speeding leaderboard." },
  { href: "/Home/AI/maintenance",       label: "Predictive Maintenance",  group: "Transport", desc: "Buses likely needing service soon." },
  // Library
  { href: "/Home/AI/book-recommend",    label: "Book Recommendations",    group: "Library", desc: "Per-student picks by Lexile + history." },
  { href: "/Home/AI/auto-tag",          label: "Book Auto-tagging",       group: "Library", desc: "Suggest categories on accession.", needsLLM: true },
  { href: "/Home/AI/comprehension",     label: "Comprehension Q-gen",     group: "Library", desc: "Generate questions from a passage.", needsLLM: true },
  // LMS
  { href: "/Home/AI/essay-grader",      label: "Essay Grader",            group: "LMS", desc: "Rubric-graded short answers (teacher reviews).", needsLLM: true },
  { href: "/Home/AI/transcribe",        label: "Class Transcription",     group: "LMS", desc: "Transcript + chapter summary for recordings.", needsLLM: true },
  { href: "/Home/AI/quiz-gen",          label: "Quiz Generation",         group: "LMS", desc: "Generate a quiz from lesson notes.", needsLLM: true },
  { href: "/Home/AI/curriculum-align",  label: "Curriculum Alignment",    group: "LMS", desc: "Check coverage of stated competencies.", needsLLM: true },
  // Connect
  { href: "/Home/AI/translate",         label: "Translate Notice",        group: "Connect", desc: "Translate notices to parent's preferred language.", needsLLM: true },
  { href: "/Home/AI/sentiment",         label: "Concern Sentiment",       group: "Connect", desc: "Triage incoming concerns by sentiment." },
  { href: "/Home/AI/channel",           label: "Best-channel Selector",   group: "Connect", desc: "Pick SMS / WhatsApp / Email / Voice per parent." },
  { href: "/Home/AI/draft-reply",       label: "Draft Reply Assistant",   group: "Connect", desc: "Draft a parent reply for teacher to edit.", needsLLM: true },
  // Hostel
  { href: "/Home/AI/roommate-match",    label: "Roommate Matching",       group: "Hostel", desc: "Compatibility-scored bed allocations." },
  { href: "/Home/AI/mess-sentiment",    label: "Mess Feedback Sentiment", group: "Hostel", desc: "Aggregate feedback + suggest menu changes." },
  // Cross-cutting
  { href: "/Home/AI/semantic-search",   label: "Semantic Search",         group: "Cross", desc: "Find anything across modules in plain language." },
  { href: "/Home/AI/voice-notes",       label: "Voice Notes (mobile)",    group: "Cross", desc: "Voice-to-observation for teachers." },
  { href: "/Home/AI/rag-chat",          label: "RAG School Assistant",    group: "Cross", desc: "Ask questions about your own circulars + policies.", needsLLM: true },
  { href: "/Home/AI/anomaly",           label: "Cross-module Anomalies",  group: "Cross", desc: "Unusual patterns across logins, fees, and grades." },
];
