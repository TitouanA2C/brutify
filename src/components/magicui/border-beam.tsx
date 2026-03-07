"use client"

import { cn } from "@/lib/utils"

interface BorderBeamProps {
  className?: string
  size?: number
  duration?: number
  delay?: number
  colorFrom?: string
  colorTo?: string
}

export const BorderBeam = ({
  className,
  size = 200,
  duration = 15,
  delay = 0,
  colorFrom = "#ffaa40",
  colorTo = "#9c40ff",
}: BorderBeamProps) => {
  return (
    <div
      style={
        {
          "--size": size,
          "--duration": duration,
          "--delay": delay,
          "--color-from": colorFrom,
          "--color-to": colorTo,
        } as React.CSSProperties
      }
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[inherit]",
        className
      )}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-[inherit]",
          "[mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 rounded-[inherit]",
            "animate-border-beam",
            "[background:linear-gradient(90deg,var(--color-from),var(--color-to))]",
            "[mask:linear-gradient(white,white)_content-box,linear-gradient(white,white)]",
            "[mask-composite:xor]",
            "p-[1px]"
          )}
        />
      </div>
    </div>
  )
}
