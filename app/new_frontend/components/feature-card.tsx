"use client"

import type { ReactNode } from "react"
import { motion } from "framer-motion"

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  gradient: string
  iconColor: string
}

export function FeatureCard({ icon, title, description, gradient, iconColor }: FeatureCardProps) {
  return (
    <motion.div
      className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 shadow-sm border border-white/20 dark:border-gray-800/50 hover:shadow-md transition-all hardware-accelerated`}
      whileHover={{
        y: -5,
        scale: 1.02,
        transition: { duration: 0.2, ease: "easeOut" },
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: "easeOut" },
      }}
      viewport={{ once: true, margin: "-50px" }}
    >
      <div
        className={`h-12 w-12 rounded-xl bg-white/50 dark:bg-gray-800/50 flex items-center justify-center mb-4 ${iconColor}`}
      >
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  )
}
