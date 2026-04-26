"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { fontFamily: "Google Sans, ui-sans-serif, system-ui" },
        }}
        richColors closeButton
      />
    </SessionProvider>
  );
}
