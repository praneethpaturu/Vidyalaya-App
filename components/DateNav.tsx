"use client";
import { useRouter } from "next/navigation";

export default function DateNav({ basePath, defaultDate }: { basePath: string; defaultDate: string }) {
  const router = useRouter();
  return (
    <input
      type="date"
      defaultValue={defaultDate}
      className="input max-w-fit"
      onChange={(e) => router.push(`${basePath}?date=${e.target.value}`)}
    />
  );
}
