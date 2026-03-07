"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/magicui/border-beam";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold-outline" | "gold-premium";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gold-gradient text-brutify-bg font-semibold shadow-[0_0_25px_rgba(255,171,0,0.25)] hover:shadow-[0_0_50px_rgba(255,171,0,0.45)]",
  secondary:
    "border border-white/[0.1] bg-white/[0.03] backdrop-blur-sm text-brutify-text-primary hover:bg-white/[0.06] hover:border-white/[0.15]",
  ghost:
    "bg-transparent text-brutify-text-secondary hover:text-brutify-text-primary hover:bg-white/[0.04]",
  "gold-outline":
    "border border-brutify-gold/20 bg-brutify-gold/[0.04] text-brutify-gold font-semibold hover:bg-brutify-gold/[0.08] hover:border-brutify-gold/30",
  "gold-premium":
    "relative bg-gold-gradient text-brutify-bg font-bold shadow-[0_0_30px_rgba(255,171,0,0.3)] hover:shadow-[0_0_60px_rgba(255,171,0,0.5)]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-5 py-2.5 text-sm rounded-xl",
  lg: "px-7 py-3 text-base rounded-xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 font-body font-medium transition-all duration-150 ease-out cursor-pointer disabled:opacity-50 disabled:pointer-events-none overflow-hidden hover:scale-105 active:scale-98",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        style={{ willChange: 'transform' }}
        {...props}
      >
        {variant === "gold-premium" && (
          <BorderBeam 
            className="absolute inset-0" 
            size={250} 
            duration={12} 
            colorFrom="#FFAB00" 
            colorTo="#FFD700"
          />
        )}
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = "Button";
