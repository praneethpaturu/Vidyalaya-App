import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "tonal" | "outline" | "ghost" | "danger" | "coral";
type Size = "sm" | "md" | "lg";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  fullWidth?: boolean;
};

const SIZE: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-11 px-5 text-sm gap-2",
};

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900",
  tonal:   "bg-brand-50 text-brand-700 hover:bg-brand-100",
  outline: "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400",
  ghost:   "text-brand-700 hover:bg-brand-50",
  danger:  "bg-rose-600 text-white hover:bg-rose-700",
  coral:   "text-white bg-[var(--color-accent-600)] hover:bg-[var(--color-accent-500)]",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", size = "md", loading, disabled, fullWidth,
    iconLeft, iconRight, className, children, ...rest },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      type={rest.type ?? "button"}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-lg font-medium select-none whitespace-nowrap",
        "transition-colors duration-150 ease-[var(--ease-out)]",
        "focus-visible:outline-none focus-visible:shadow-focus",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        SIZE[size],
        VARIANT[variant],
        fullWidth && "w-full",
        className,
      )}
      {...rest}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" fill="none" opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
        </svg>
      )}
      {!loading && iconLeft}
      {children}
      {!loading && iconRight}
    </button>
  );
});
export default Button;
