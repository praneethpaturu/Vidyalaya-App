import "./globals.css";
import "leaflet/dist/leaflet.css";
import "katex/dist/katex.min.css";
import type { Metadata } from "next";
import { Inter, Inter_Tight, Noto_Sans_Devanagari } from "next/font/google";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Providers from "@/components/Providers";
import I18nClient from "@/components/I18nClient";

// Inter for body / display, Noto Sans Devanagari for Hindi.
// All self-hosted by next/font — no external CDN call.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-tight",
});
const noto = Noto_Sans_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "Vidyalaya — School Suite",
  description: "Unified school operations: academics, transport, fees, attendance, inventory, payroll, AI insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} ${noto.variable}`}>
      <body className="min-h-screen antialiased text-slate-900">
        {/* WCAG 2.1 §2.4.1 Bypass blocks — keyboard skip-link */}
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-brand-700 focus:text-white focus:rounded">
          Skip to main content
        </a>
        <I18nClient>
          <Providers>{children}</Providers>
        </I18nClient>
        {/* Privacy-friendly analytics — counts page views per route, no cookies */}
        <Analytics />
        {/* Core Web Vitals (LCP / INP / CLS) per route, sampled real-user metrics */}
        <SpeedInsights />
      </body>
    </html>
  );
}
