"use client";

import { forwardRef } from "react";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends Omit<HTMLMotionProps<"div">, "children" | "className"> {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, children, hoverable = true, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { y: -4, transition: { duration: 0.25, ease: "easeOut" } } : undefined}
        className={cn(
          "group relative overflow-hidden rounded-2xl border border-brutify-gold/10 bg-[#111113]/60 backdrop-blur-lg p-5 shadow-[0_0_20px_rgba(255,171,0,0.15),0_4px_40px_rgba(0,0,0,0.5)] transition-all duration-300",
          hoverable &&
            "hover:border-brutify-gold/25 hover:shadow-[0_0_40px_rgba(255,171,0,0.3),0_8px_50px_rgba(0,0,0,0.6)] cursor-pointer",
          className
        )}
        {...props}
      >
        {/* PERMANENT dramatic gold glow - always visible! */}
        <div 
          className="absolute -top-12 -right-12 h-32 w-32 rounded-full bg-[#FFAB00] opacity-[0.08] blur-[60px] transition-opacity duration-500 group-hover:opacity-[0.2] pointer-events-none"
        />
        {children}
      </motion.div>
    );
  }
);

Card.displayName = "Card";
