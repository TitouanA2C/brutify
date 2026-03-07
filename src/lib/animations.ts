import { Transition } from "framer-motion"

// Transition optimisée pour 60+ FPS
export const smoothTransition: Transition = {
  type: "tween",
  ease: [0.16, 1, 0.3, 1], // Custom easing
  duration: 0.4,
}

// Transition rapide
export const fastTransition: Transition = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
}

// Spring optimisé (moins de calculs)
export const smoothSpring: Transition = {
  type: "spring",
  damping: 30,
  stiffness: 300,
  mass: 0.5,
}

// Variants optimisés pour les animations courantes
export const fadeInUp = {
  initial: { 
    opacity: 0, 
    y: 20,
    transition: smoothTransition,
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: smoothTransition,
  },
  exit: { 
    opacity: 0, 
    y: -10,
    transition: fastTransition,
  },
}

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: smoothTransition },
  exit: { opacity: 0, transition: fastTransition },
}

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: smoothTransition },
  exit: { opacity: 0, scale: 0.95, transition: fastTransition },
}
