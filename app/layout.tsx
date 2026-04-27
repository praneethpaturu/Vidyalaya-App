import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import Providers from "@/components/Providers";

// Inter for body (excellent at small sizes), Inter Tight for display headings.
// Self-hosted by next/font, served from the same origin — no external CDN call.
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

export const metadata: Metadata = {
  title: "Vidyalaya — School Suite",
  description: "Unified school operations: academics, transport, fees, attendance, inventory, payroll, AI insights.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body className="min-h-screen antialiased text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
