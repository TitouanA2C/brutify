"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

interface AnimatedShinyTextProps {
  children: React.ReactNode
  className?: string
  shimmerWidth?: number
}

export function AnimatedShinyText({
  children,
  className,
  shimmerWidth = 100,
}: AnimatedShinyTextProps) {
  return (
    <motion.span
      initial={{
        backgroundSize: "0% 100%",
      }}
      animate={{
        backgroundSize: "100% 100%",
      }}
      transition={{
        duration: 2,
        ease: "linear",
        repeat: Infinity,
        repeatType: "reverse",
      }}
      className={cn(
        "inline-block bg-linear-to-r from-[#FFD700] via-[#FFAB00] to-[#FFD700] bg-[length:var(--shimmer-width)_100%] bg-clip-text text-transparent",
        className
      )}
      style={
        {
          "--shimmer-width": `${shimmerWidth}%`,
        } as React.CSSProperties
      }
    >
      {children}
    </motion.span>
  )
}
