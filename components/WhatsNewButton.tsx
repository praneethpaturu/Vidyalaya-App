"use client";

import { Lightbulb } from "lucide-react";

export default function WhatsNewButton() {
  return (
    <a
      href="https://selfhelp.myclassboard.com/ProductUpdates"
      target="_blank"
      rel="noopener noreferrer"
      title="What's New"
      aria-label="What's New"
      className="relative inline-flex items-center justify-center w-9 h-9 rounded-full bg-amber-400 text-white shadow-[0_0_0_4px_rgba(251,191,36,0.18)] hover:bg-amber-500 transition"
    >
      <Lightbulb className="w-4 h-4" fill="currentColor" />
    </a>
  );
}
