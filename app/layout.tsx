import "./globals.css";
import "leaflet/dist/leaflet.css";
import type { Metadata } from "next";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Vidyalaya — School OS",
  description: "Unified school management: academics, transport, fees, attendance, inventory, payroll",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
