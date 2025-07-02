"use client"

import { motion } from "framer-motion"
import { Quote } from "lucide-react"
import { useAnimation } from "@/components/animation-provider"

interface TestimonialCardProps {
  quote: string
  author: string
  role: string
  avatarUrl: string
  gradientBorder?: string
}

export default function TestimonialCard({
  quote,
  author,
  role,
  avatarUrl,
  gradientBorder = "border-border",
}: TestimonialCardProps) {
  const { isReady, prefersReducedMotion } = useAnimation()

  return (
    <motion.div
      whileHover={
        isReady && !prefersReducedMotion
          ? {
              y: -10,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }
          : {}
      }
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border ${gradientBorder} relative h-full hardware-accelerated`}
    >
      <Quote className="h-8 w-8 text-violet-400/20 absolute top-4 right-4" />
      <p className="text-muted-foreground mb-6">{quote}</p>
      <div className="flex items-center">
        <div className="h-10 w-10 rounded-full overflow-hidden mr-3">
          <img
            src={avatarUrl || "/placeholder.svg"}
            alt={author}
            className="h-full w-full object-cover image-rendering-crisp"
            loading="lazy"
          />
        </div>
        <div>
          <h4 className="font-medium">{author}</h4>
          <p className="text-sm text-muted-foreground">{role}</p>
        </div>
      </div>
    </motion.div>
  )
}
