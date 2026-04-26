"use client";
// Lightweight SVG illustrations for class card banners — inspired by the
// Google Classroom subject artwork (Algebra, Geometry, Physics, etc.).
// These are illustrative, not pixel copies of Google's IP.

import * as React from "react";

type Props = { subject?: string; className?: string };

function pickKind(s = ""): string {
  const t = s.toLowerCase();
  if (/(algebra|math|maths|arith)/.test(t)) return "math";
  if (/(geom|trig)/.test(t)) return "geometry";
  if (/(phys|mechan)/.test(t)) return "physics";
  if (/(chem)/.test(t)) return "chemistry";
  if (/(bio|life)/.test(t)) return "biology";
  if (/(comp|cs|cod|program)/.test(t)) return "cs";
  if (/(eng|literat|hindi|sansk|kann|tam|telugu)/.test(t)) return "lang";
  if (/(hist|civic|social|geo)/.test(t)) return "social";
  if (/(art|draw|music)/.test(t)) return "art";
  if (/(sport|pe|phys ed|games)/.test(t)) return "sports";
  return "default";
}

export function SubjectIllustration({ subject, className }: Props) {
  const kind = pickKind(subject);
  const common = "absolute inset-0 w-full h-full pointer-events-none";

  if (kind === "math")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g opacity="0.95">
          <rect x="240" y="50" width="60" height="90" rx="10" fill="#b39ddb" />
          <rect x="248" y="60" width="44" height="20" rx="3" fill="#fff" />
          <circle cx="258" cy="98" r="5" fill="#fff" /><circle cx="278" cy="98" r="5" fill="#fff" />
          <circle cx="258" cy="118" r="5" fill="#fff" /><circle cx="278" cy="118" r="5" fill="#fff" />
          <polygon points="190,140 230,60 250,140" fill="#ffb74d" />
          <rect x="155" y="125" width="80" height="10" rx="2" fill="#ff9a76" />
          <path d="M310 60 q20 0 20 80" stroke="#ef5350" strokeWidth="4" fill="none" />
          <circle cx="330" cy="138" r="4" fill="#ef5350" />
        </g>
      </svg>
    );

  if (kind === "geometry")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g>
          <rect x="220" y="55" width="70" height="90" rx="8" fill="#81c784" />
          <rect x="232" y="68" width="46" height="20" rx="3" fill="#fff" />
          <circle cx="245" cy="105" r="4" fill="#fff" /><circle cx="265" cy="105" r="4" fill="#fff" />
          <rect x="305" y="60" width="40" height="40" fill="none" stroke="#fbc02d" strokeWidth="3" />
          <circle cx="325" cy="125" r="14" fill="none" stroke="#ff7043" strokeWidth="3" />
          <line x1="325" y1="125" x2="345" y2="105" stroke="#ff7043" strokeWidth="3" />
        </g>
      </svg>
    );

  if (kind === "physics")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g>
          <rect x="200" y="80" width="90" height="6" rx="2" fill="#bf6b3b" />
          {[0,1,2,3,4].map((i) => (
            <g key={i}>
              <line x1={215+i*15} y1="86" x2={215+i*15} y2="135" stroke="#999" strokeWidth="1.5" />
              <circle cx={215+i*15} cy="142" r="7" fill="#ec407a" />
            </g>
          ))}
          <circle cx="320" cy="140" r="14" fill="#ef5350" />
          <path d="M320 126 q-3 -8 4 -10" stroke="#43a047" strokeWidth="2.5" fill="none" />
          <path d="M345 105 q15 8 12 30 q-3 12 -16 8" stroke="#1976d2" strokeWidth="6" fill="none" />
          <rect x="350" y="92" width="6" height="14" rx="2" fill="#9e9e9e" />
        </g>
      </svg>
    );

  if (kind === "chemistry")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g>
          <path d="M250 60 v45 l-25 40 h60 l-25 -40 v-45z" fill="#4dd0e1" opacity="0.85" />
          <rect x="248" y="55" width="14" height="10" rx="2" fill="#bdbdbd" />
          <circle cx="320" cy="120" r="8" fill="#f06292" /><circle cx="335" cy="100" r="6" fill="#ffd54f" />
          <circle cx="350" cy="125" r="10" fill="#81c784" />
          <line x1="320" y1="120" x2="335" y2="100" stroke="#5d4037" strokeWidth="2" />
          <line x1="335" y1="100" x2="350" y2="125" stroke="#5d4037" strokeWidth="2" />
        </g>
      </svg>
    );

  if (kind === "biology")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g>
          <path d="M270 50 q-30 30 0 60 q30 30 0 60" stroke="#26a69a" strokeWidth="3.5" fill="none" />
          <path d="M310 50 q30 30 0 60 q-30 30 0 60" stroke="#ef5350" strokeWidth="3.5" fill="none" />
          {[60,80,100,120,140,160].map((y, i) => (
            <line key={i} x1="270" y1={y} x2="310" y2={y} stroke={i%2 ? "#ffb300" : "#7e57c2"} strokeWidth="2" />
          ))}
          <ellipse cx="345" cy="130" rx="22" ry="14" fill="#fff" stroke="#90a4ae" strokeWidth="2" />
          <circle cx="340" cy="128" r="3" fill="#26a69a" /><circle cx="350" cy="132" r="2" fill="#ffb300" />
        </g>
      </svg>
    );

  if (kind === "cs")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g>
          <rect x="220" y="60" width="120" height="80" rx="6" fill="#fff" stroke="#ef9a9a" strokeWidth="3" />
          <text x="245" y="105" fontFamily="monospace" fontSize="22" fill="#ef5350" fontWeight="700">{`</>`}</text>
          <rect x="210" y="140" width="140" height="8" rx="2" fill="#ffcdd2" />
          <rect x="180" y="100" width="20" height="40" rx="3" fill="#a1887f" />
          <ellipse cx="190" cy="98" rx="12" ry="6" fill="#a1887f" />
        </g>
      </svg>
    );

  if (kind === "lang")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g>
          <path d="M225 70 q40 -10 80 0 v75 q-40 -10 -80 0 z" fill="#fff" stroke="#90a4ae" strokeWidth="2" />
          <line x1="265" y1="70" x2="265" y2="145" stroke="#90a4ae" strokeWidth="2" />
          <circle cx="245" cy="55" r="10" fill="#ef5350" /><circle cx="285" cy="55" r="8" fill="#7e57c2" />
          <path d="M310 60 l-12 6 v18 l12 6 z" fill="#26a69a" />
        </g>
      </svg>
    );

  if (kind === "social")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g>
          <circle cx="290" cy="105" r="46" fill="#64b5f6" />
          <path d="M244 105 q23 -28 46 -28 q23 0 46 28" stroke="#fff" strokeWidth="2" fill="none" />
          <path d="M244 105 q23 28 46 28 q23 0 46 -28" stroke="#fff" strokeWidth="2" fill="none" />
          <line x1="290" y1="59" x2="290" y2="151" stroke="#fff" strokeWidth="2" />
          <line x1="244" y1="105" x2="336" y2="105" stroke="#fff" strokeWidth="2" />
        </g>
      </svg>
    );

  if (kind === "art")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g>
          <path d="M290 70 q40 0 40 40 q0 30 -30 30 q-15 0 -15 -12 q0 -10 -10 -10 q-30 0 -30 -25 q0 -23 45 -23z" fill="#fff" stroke="#90a4ae" strokeWidth="2" />
          <circle cx="278" cy="92" r="6" fill="#ef5350" /><circle cx="305" cy="88" r="6" fill="#fbc02d" />
          <circle cx="320" cy="108" r="6" fill="#42a5f5" /><circle cx="290" cy="120" r="6" fill="#66bb6a" />
        </g>
      </svg>
    );

  if (kind === "sports")
    return (
      <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
        <g>
          <circle cx="300" cy="105" r="36" fill="#fff" stroke="#222" strokeWidth="2" />
          <polygon points="300,80 318,93 311,114 289,114 282,93" fill="#222" />
        </g>
      </svg>
    );

  // default
  return (
    <svg viewBox="0 0 400 200" className={`${common} ${className ?? ""}`}>
      <g opacity="0.85">
        <rect x="240" y="60" width="60" height="80" rx="6" fill="#fff" stroke="#cfd8dc" strokeWidth="2" />
        <line x1="252" y1="80" x2="288" y2="80" stroke="#cfd8dc" strokeWidth="2" />
        <line x1="252" y1="95" x2="288" y2="95" stroke="#cfd8dc" strokeWidth="2" />
        <line x1="252" y1="110" x2="278" y2="110" stroke="#cfd8dc" strokeWidth="2" />
        <circle cx="320" cy="85" r="14" fill="#ffd54f" />
      </g>
    </svg>
  );
}
