"use client"

import { useEffect, useRef, useMemo } from "react"
import { useInView, useMotionValue, useSpring } from "framer-motion"

import { cn } from "@/lib/utils"

export function NumberTicker({
  value,
  direction = "up",
  delay = 0,
  className,
  decimalPlaces = 0,
}: {
  value: number
  direction?: "up" | "down"
  className?: string
  delay?: number
  decimalPlaces?: number
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const motionValue = useMotionValue(direction === "down" ? value : 0)
  
  // Optimized spring config for smoother animation
  const springValue = useSpring(motionValue, {
    damping: 80,
    stiffness: 200,
    mass: 0.5,
  })
  
  const isInView = useInView(ref, { once: true, margin: "0px" })

  // Memoize formatter to avoid recreation
  const formatter = useMemo(
    () => new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }),
    [decimalPlaces]
  )

  useEffect(() => {
    if (isInView) {
      setTimeout(() => {
        motionValue.set(direction === "down" ? 0 : value)
      }, delay * 1000)
    }
  }, [motionValue, isInView, delay, value, direction])

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = formatter.format(
          Number(latest.toFixed(decimalPlaces))
        )
      }
    })
    
    return () => unsubscribe()
  }, [springValue, decimalPlaces, formatter])

  return (
    <span
      className={cn(
        "inline-block tabular-nums tracking-wider",
        className
      )}
      ref={ref}
    />
  )
}
