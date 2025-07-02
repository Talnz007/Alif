"use client"

import type React from "react"

import Link from "next/link"
import { motion } from "framer-motion"
import { ChevronRight } from "lucide-react"

interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  gradient: string
  iconBg: string
  iconColor: string
  borderColor: string
}

export default function FeatureCard({
  title,
  description,
  icon,
  href,
  gradient,
  iconBg,
  iconColor,
  borderColor,
}: FeatureCardProps) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ y: -5 }}
        className={`bg-gradient-to-br ${gradient} rounded-xl p-6 shadow-sm hover:shadow-md transition-all border ${borderColor} h-full`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className={`${iconBg} p-3 rounded-lg`}>
            <div className={iconColor}>{icon}</div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </motion.div>
    </Link>
  )
}
