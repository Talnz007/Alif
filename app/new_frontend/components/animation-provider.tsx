"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

interface AnimationContextType {
  isReady: boolean
  prefersReducedMotion: boolean
}

const AnimationContext = createContext<AnimationContextType>({
  isReady: false,
  prefersReducedMotion: false,
})

export function useAnimation() {
  return useContext(AnimationContext)
}

interface AnimationProviderProps {
  children: ReactNode
}

export function AnimationProvider({ children }: AnimationProviderProps) {
  const [isReady, setIsReady] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    // Check if user prefers reduced motion
    if (typeof window !== "undefined") {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
      setPrefersReducedMotion(mediaQuery.matches)

      const handleChange = () => {
        setPrefersReducedMotion(mediaQuery.matches)
      }

      mediaQuery.addEventListener("change", handleChange)

      // Set animation ready after a short delay to prevent initial animation flashes
      const timeout = setTimeout(() => {
        setIsReady(true)
      }, 300)

      return () => {
        mediaQuery.removeEventListener("change", handleChange)
        clearTimeout(timeout)
      }
    }

    return undefined
  }, [])

  return <AnimationContext.Provider value={{ isReady, prefersReducedMotion }}>{children}</AnimationContext.Provider>
}
