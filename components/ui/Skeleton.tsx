import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export default function Skeleton({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("skeleton h-4 w-full", className)}
      {...rest}
    />
  );
}
