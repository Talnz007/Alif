"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import SmoothScrollLink from "@/components/smooth-scroll-link"
import Image from "next/image"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const navItems = [
    { name: "Tools", href: "#tools" },
    { name: "Interactive Learning", href: "#demo" },
    { name: "Reviews", href: "#testimonials" },
    { name: "Pricing", href: "#pricing" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3">
            <div className="relative h-8 w-8 flex-shrink-0">
              <Image src="/alif-logo-black.jpeg" alt="الف" fill className="object-contain dark:hidden" priority />
              <Image src="/alif-logo-white.jpeg" alt="الف" fill className="object-contain hidden dark:block" priority />
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-orange-500">
              Alif
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <SmoothScrollLink
                key={item.name}
                href={item.href}
                className="text-sm font-medium transition-colors hover:text-indigo-600 text-muted-foreground"
              >
                {item.name}
              </SmoothScrollLink>
            ))}
          </nav>

          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Button
              asChild
              className="hidden md:inline-flex bg-gradient-to-r from-indigo-600 to-orange-500 hover:from-indigo-700 hover:to-orange-600"
            >
              <Link href="/register" target="_blank">
                Sign Up
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-b">
            {navItems.map((item) => (
              <SmoothScrollLink
                key={item.name}
                href={item.href}
                className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.name}
              </SmoothScrollLink>
            ))}
          </div>
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="px-5">
              <Button asChild className="w-full bg-gradient-to-r from-indigo-600 to-orange-500">
                <Link href="/register" target="_blank">
                  Sign Up
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
