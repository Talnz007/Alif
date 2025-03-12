"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function AlifLogo({ className = "w-8 h-8" }) {
  const { theme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Determine if we're in dark mode
  const isDarkMode = mounted && (theme === "dark" || resolvedTheme === "dark")

  // SVG with dynamic fill based on theme
  return (
    <div className={className} style={{ position: "relative" }}>
      {mounted ? (
        <img
          src="/images/alif-logo.svg"
          alt="Alif Logo"
          className="w-full h-full"
          style={{
            filter: isDarkMode ? "invert(1)" : "none"
          }}
        />
      ) : (
        <div className="w-full h-full" />
      )}
    </div>
  )
}