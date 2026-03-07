import { forwardRef, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={id}
            className="text-xs font-body font-medium text-brutify-text-secondary"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            className={cn(
              "w-full rounded-xl border bg-white/[0.02] backdrop-blur-lg px-4 py-2.5 text-sm font-body text-brutify-text-primary placeholder:text-brutify-text-muted outline-none transition-all duration-200 shadow-[0_0_12px_rgba(255,171,0,0.06)]",
              error
                ? "border-brutify-danger/40 focus:border-brutify-danger/60 focus:ring-2 focus:ring-brutify-danger/30"
                : "border-white/[0.08] focus:border-brutify-gold/40 focus:ring-2 focus:ring-brutify-gold/30 focus:shadow-[0_0_30px_rgba(255,171,0,0.25)]",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-[11px] font-body text-brutify-danger/90">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
