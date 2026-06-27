import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "gold" | "danger" | "success";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy text-navy-foreground hover:bg-navy/90 shadow-sm hover:shadow-md",
  outline: "border border-navy/25 bg-white text-navy hover:border-gold hover:bg-gold/10",
  ghost: "text-navy hover:bg-navy/5",
  gold: "bg-gold text-navy hover:bg-gold/90 shadow-sm hover:shadow-md",
  danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
};

export interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  leading?: ReactNode;
  trailing?: ReactNode;
}

/**
 * Btn — unified button with crisp micro-interactions:
 * scale-down on press, subtle shadow lift on hover, focus ring.
 */
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(
  ({ variant = "primary", leading, trailing, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      {...rest}
      className={cn(
        "group/btn inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold tracking-wide outline-none transition-all duration-150 ease-out",
        "active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-1",
        "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100",
        VARIANTS[variant],
        className,
      )}
    >
      {leading && (
        <span className="transition-transform duration-150 group-hover/btn:-translate-x-0.5">
          {leading}
        </span>
      )}
      <span>{children}</span>
      {trailing && (
        <span className="transition-transform duration-150 group-hover/btn:translate-x-0.5">
          {trailing}
        </span>
      )}
    </button>
  ),
);
Btn.displayName = "Btn";
