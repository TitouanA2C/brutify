"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/magicui/border-beam";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, className, children }: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.h1
            initial={{ filter: 'drop-shadow(0 0 20px rgba(255,171,0,0.2))' }}
            animate={{ filter: 'drop-shadow(0 0 30px rgba(255,171,0,0.3))' }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="font-display text-4xl tracking-wider text-gold-gradient"
          >
            {title}
          </motion.h1>
          {subtitle && (
            <p className="mt-1.5 text-sm font-body text-brutify-text-secondary">
              {subtitle}
            </p>
          )}
        </motion.div>
        {children && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center gap-3"
          >
            {children}
          </motion.div>
        )}
      </div>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative mt-4 h-[2px] w-full origin-left overflow-hidden rounded-full"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-brutify-gold/50 via-brutify-gold/25 to-transparent shadow-[0_0_15px_rgba(255,171,0,0.4)]" />
        <BorderBeam 
          size={150} 
          duration={8} 
          colorFrom="#FFAB00" 
          colorTo="#FFD700"
        />
      </motion.div>
    </div>
  );
}
