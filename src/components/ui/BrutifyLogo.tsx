"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BrutifyLogoProps {
  size?: "sm" | "md" | "lg";
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: "text-xl",
  md: "text-2xl",
  lg: "text-4xl",
};

export function BrutifyLogo({ size = "md", animated = true, className }: BrutifyLogoProps) {
  const letters = "BRUTIFY".split("");

  if (!animated) {
    return (
      <span className={cn("font-display tracking-wider text-gold-gradient select-none", sizeMap[size], className)}>
        BRUTIFY
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-baseline select-none", sizeMap[size], className)}>
      {letters.map((letter, i) => (
        <motion.span
          key={i}
          className="font-display tracking-wider text-gold-gradient"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: i * 0.05,
            duration: 0.35,
            ease: "easeOut",
          }}
        >
          {letter}
        </motion.span>
      ))}
    </span>
  );
}
