"use client"

import type React from "react"

import { type ReactNode, useCallback } from "react"
import Link from "next/link"
import { useAnimation } from "@/components/animation-provider"

interface SmoothScrollLinkProps {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
  offset?: number
}

export default function SmoothScrollLink({
  href,
  children,
  className,
  onClick,
  offset = 80, // Default offset for header
}: SmoothScrollLinkProps) {
  const { prefersReducedMotion } = useAnimation()

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Only apply smooth scrolling for hash links on the same page
      if (href.startsWith("#")) {
        e.preventDefault()

        const targetId = href.substring(1)
        const targetElement = document.getElementById(targetId)

        if (targetElement) {
          // Get the target's position
          const targetPosition = targetElement.getBoundingClientRect().top + window.scrollY - offset

          // Smooth scroll to the element (or instant scroll if reduced motion is preferred)
          window.scrollTo({
            top: targetPosition,
            behavior: prefersReducedMotion ? "auto" : "smooth",
          })

          // Update URL without reloading the page
          window.history.pushState(null, "", href)

          // Call additional onClick handler if provided
          if (onClick) onClick()
        }
      } else if (onClick) {
        onClick()
      }
    },
    [href, onClick, offset, prefersReducedMotion],
  )

  return (
    <Link href={href} className={className} onClick={handleClick}>
      {children}
    </Link>
  )
}
