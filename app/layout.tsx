import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import { Inter, Inter_Tight, Noto_Sans_Devanagari } from "next/font/google";
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
        <I18nClient>
          <Providers>{children}</Providers>
        </I18nClient>
      </body>
    </html>
  );
}
