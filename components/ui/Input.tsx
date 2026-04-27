import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  error?: string;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { id, label, hint, error, iconLeft, iconRight, className, ...rest }, ref,
) {
  const reactId = useId();
  const inputId = id ?? reactId;
  const describedBy = [hint && `${inputId}-hint`, error && `${inputId}-err`].filter(Boolean).join(" ");

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="text-xs font-medium text-slate-700 mb-1 block">
          {label}
        </label>
      )}
      <div className="relative">
        {iconLeft && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {iconLeft}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy || undefined}
          className={cn(
            "w-full px-3.5 py-2.5 rounded-lg border bg-white text-sm",
            "placeholder:text-slate-400 disabled:bg-slate-50 disabled:text-slate-400",
            "focus:outline-none focus:border-brand-600 focus:shadow-focus",
            "transition-colors duration-150",
            iconLeft && "pl-10",
            iconRight && "pr-10",
            error ? "border-rose-400" : "border-slate-300 hover:border-slate-400",
            className,
          )}
          {...rest}
        />
        {iconRight && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {iconRight}
          </span>
        )}
      </div>
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-[11px] text-slate-500 mt-1">{hint}</p>
      )}
      {error && (
        <p id={`${inputId}-err`} className="text-[11px] text-rose-600 mt-1" role="alert">{error}</p>
      )}
    </div>
  );
});
export default Input;
