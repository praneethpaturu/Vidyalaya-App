"use client";
// Read ?toast=... and ?toastType=... from the URL once on mount, then strip them.
// Server actions call redirect(`?toast=Done`) to flash a message after a redirect.

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { toast } from "sonner";

export default function ToastFromSearchParams() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const msg = sp.get("toast");
    const type = (sp.get("toastType") ?? "success") as "success" | "error" | "info" | "warning";
    if (msg) {
      toast[type === "warning" ? "warning" : type === "error" ? "error" : type === "info" ? "info" : "success"](msg);
      const newSp = new URLSearchParams(sp.toString());
      newSp.delete("toast"); newSp.delete("toastType");
      const qs = newSp.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [sp, router, pathname]);

  return null;
}
