"use client"

import { type ReactNode, useRef } from "react"
import { motion, useInView, type Variants } from "framer-motion"
import { useAnimation } from "@/components/animation-provider"

interface AnimatedSectionProps {
  children: ReactNode
  className?: string
  delay?: number
  direction?: "up" | "down" | "left" | "right" | "none"
  distance?: number
  duration?: number
  once?: boolean
  threshold?: number
}

export default function AnimatedSection({
  children,
  className = "",
  delay = 0,
  direction = "up",
  distance = 50,
  duration = 0.5,
  once = true,
  threshold = 0.1,
}: AnimatedSectionProps) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once, amount: threshold })
  const { isReady, prefersReducedMotion } = useAnimation()

  // Define animation variants based on direction
  const getVariants = (): Variants => {
    // If user prefers reduced motion or animations aren't ready yet, use minimal animation
    if (prefersReducedMotion || !isReady) {
      return {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
      }
    }

    // Otherwise, use full animations based on direction
    switch (direction) {
      case "up":
        return {
          hidden: { opacity: 0, y: distance },
          visible: { opacity: 1, y: 0 },
        }
      case "down":
        return {
          hidden: { opacity: 0, y: -distance },
          visible: { opacity: 1, y: 0 },
        }
      case "left":
        return {
          hidden: { opacity: 0, x: distance },
          visible: { opacity: 1, x: 0 },
        }
      case "right":
        return {
          hidden: { opacity: 0, x: -distance },
          visible: { opacity: 1, x: 0 },
        }
      case "none":
      default:
        return {
          hidden: { opacity: 0 },
          visible: { opacity: 1 },
        }
    }
  }

  const variants = getVariants()

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1], // Custom ease curve for smooth animation
      }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
