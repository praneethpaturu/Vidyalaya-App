import { cn } from "@/lib/utils";
import { initials } from "@/lib/utils";

type Size = "xs" | "sm" | "md" | "lg" | "xl";
const SIZE: Record<Size, string> = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-16 h-16 text-lg",
};

type Props = {
  name: string;
  src?: string;
  size?: Size;
  /** Decorative ring around the avatar. */
  ring?: boolean;
  className?: string;
};

export default function Avatar({ name, src, size = "md", ring, className }: Props) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover",
          SIZE[size],
          ring && "ring-2 ring-white",
          className,
        )}
      />
    );
  }
  return (
    <div
      role="img"
      aria-label={name}
      className={cn(
        "rounded-full bg-brand-50 text-brand-800 font-semibold flex items-center justify-center select-none",
        SIZE[size],
        ring && "ring-2 ring-white",
        className,
      )}
    >
      {initials(name)}
    </div>
  );
}
