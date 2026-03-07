"use client"

import React, { useEffect, useId, useRef, useState, useMemo } from "react"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"

interface DotPatternProps extends React.SVGProps<SVGSVGElement> {
  width?: number
  height?: number
  x?: number
  y?: number
  cx?: number
  cy?: number
  cr?: number
  className?: string
  glow?: boolean
  [key: string]: unknown
}

export function DotPattern({
  width = 16,
  height = 16,
  x = 0,
  y = 0,
  cx = 1,
  cy = 1,
  cr = 1,
  className,
  glow = false,
  ...props
}: DotPatternProps) {
  const id = useId()
  const containerRef = useRef<SVGSVGElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        setDimensions({ width, height })
      }
    }

    updateDimensions()
    
    // Use ResizeObserver for better performance than window resize
    const resizeObserver = new ResizeObserver(updateDimensions)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }
    
    return () => {
      resizeObserver.disconnect()
    }
  }, [])

  // Memoize dots calculation to avoid re-rendering
  const dots = useMemo(() => {
    return Array.from(
      {
        length:
          Math.ceil(dimensions.width / width) *
          Math.ceil(dimensions.height / height),
      },
      (_, i) => {
        const col = i % Math.ceil(dimensions.width / width)
        const row = Math.floor(i / Math.ceil(dimensions.width / width))
        return {
          key: `${col}-${row}`,
          x: col * width + cx + x,
          y: row * height + cy + y,
          delay: glow ? Math.random() * 5 : 0,
          duration: glow ? Math.random() * 3 + 2 : 0,
        }
      }
    )
  }, [dimensions, width, height, cx, cy, x, glow])

  return (
    <svg
      ref={containerRef}
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 h-full w-full text-brutify-gold/20",
        className
      )}
      {...props}
    >
      {glow && (
        <defs>
          <radialGradient id={`${id}-gradient`}>
            <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </radialGradient>
        </defs>
      )}
      {dots.map((dot) => (
        glow ? (
          <motion.circle
            key={dot.key}
            cx={dot.x}
            cy={dot.y}
            r={cr}
            fill={`url(#${id}-gradient)`}
            initial={{ opacity: 0.4, scale: 1 }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: dot.duration,
              repeat: Infinity,
              repeatType: "reverse",
              delay: dot.delay,
              ease: "easeInOut",
            }}
          />
        ) : (
          <circle
            key={dot.key}
            cx={dot.x}
            cy={dot.y}
            r={cr}
            fill="currentColor"
          />
        )
      ))}
    </svg>
  )
}
