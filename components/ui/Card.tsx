import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  /** Add the standard padding (`.card-pad`). Defaults to true. */
  padded?: boolean;
  /** Make the card subtly interactive on hover. */
  interactive?: boolean;
  /** Ash variant — flatter, lighter shadow for dense lists. */
  flat?: boolean;
};

const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { padded = true, interactive, flat, className, ...rest }, ref,
) {
  return (
    <div
      ref={ref}
      className={cn(
        "bg-white rounded-2xl border border-slate-200",
        flat ? "shadow-xs" : "shadow-sm",
        interactive && "transition-shadow duration-200 hover:shadow-md",
        padded && "p-5",
        className,
      )}
      {...rest}
    />
  );
});
export default Card;

export const CardHeader = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex items-start justify-between gap-3 mb-3", className)} {...p} />
);
export const CardTitle = ({ className, ...p }: HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn("text-sm font-semibold text-slate-900", className)} {...p} />
);
export const CardDescription = ({ className, ...p }: HTMLAttributes<HTMLParagraphElement>) => (
  <p className={cn("text-xs text-slate-500 mt-0.5", className)} {...p} />
);
