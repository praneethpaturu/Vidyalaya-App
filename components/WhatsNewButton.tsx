"use client";

import { Lightbulb } from "lucide-react";

// Subtle "new content" highlight — no longer a saturated amber filled circle.
// Tonal amber chip with soft halo, fits the calm light cluster.
export default function WhatsNewButton() {
  return (
    <a
      href="#whats-new"
      title="What's new"
      aria-label="What's new"
      className="relative inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-50 text-amber-700 ring-1 ring-amber-200/60 hover:bg-amber-100 hover:text-amber-800 transition-colors duration-150 focus-visible:outline-none focus-visible:shadow-focus"
    >
      <Lightbulb className="w-4 h-4" strokeWidth={2.25} />
      <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
    </a>
  );
}
