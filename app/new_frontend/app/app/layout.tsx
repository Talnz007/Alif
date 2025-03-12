"use client"

import type React from "react"
import { Inter } from "next/font/google"
import { useState, useEffect } from "react"
import { ThemeProvider } from "next-themes"
import { AnimatePresence, motion } from "framer-motion"
import { usePathname } from "next/navigation"
import Sidebar from "@/components/sidebar"

const inter = Inter({ subsets: ["latin"] })

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className={`flex h-screen ${inter.className}`}>
        <Sidebar />
        <AnimatePresence mode="wait">
          <motion.main
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="flex-1 overflow-hidden bg-background transition-colors duration-300"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </ThemeProvider>
  )
}

