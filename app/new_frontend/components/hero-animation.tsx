"use client"

import { useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { BookOpen, Brain, BarChart, CheckCircle, Award } from "lucide-react"

export function HeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const devicePixelRatio = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      canvas.width = rect.width * devicePixelRatio
      canvas.height = rect.height * devicePixelRatio

      ctx.scale(devicePixelRatio, devicePixelRatio)
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Create particles
    const particles: Particle[] = []
    const particleCount = 50

    interface Particle {
      x: number
      y: number
      size: number
      speedX: number
      speedY: number
      color: string
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 1,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        color: `rgba(59, 130, 246, ${Math.random() * 0.3 + 0.1})`, // Blue with varying opacity
      })
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Update and draw particles
      particles.forEach((particle) => {
        particle.x += particle.speedX
        particle.y += particle.speedY

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) {
          particle.speedX *= -1
        }

        if (particle.y < 0 || particle.y > canvas.height) {
          particle.speedY *= -1
        }

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        ctx.fill()
      })

      requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
    }
  }, [])

  return (
    <div className="relative w-full h-[500px] overflow-hidden rounded-xl border bg-background/50 backdrop-blur-sm">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ width: "100%", height: "100%" }} />

      <div className="relative z-10 w-full h-full flex items-center justify-center">
        <div className="relative w-64 h-64">
          {/* Central learning icon */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground rounded-full p-6 shadow-lg"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
          >
            <BookOpen className="h-12 w-12" />
          </motion.div>

          {/* Orbiting elements */}
          <motion.div
            className="absolute bg-white dark:bg-gray-800 rounded-full p-3 shadow-md"
            style={{ top: "10%", left: "10%" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Brain className="h-6 w-6 text-primary" />
          </motion.div>

          <motion.div
            className="absolute bg-white dark:bg-gray-800 rounded-full p-3 shadow-md"
            style={{ bottom: "15%", right: "10%" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <BarChart className="h-6 w-6 text-primary" />
          </motion.div>

          <motion.div
            className="absolute bg-white dark:bg-gray-800 rounded-full p-3 shadow-md"
            style={{ bottom: "10%", left: "15%" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 22, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <CheckCircle className="h-6 w-6 text-primary" />
          </motion.div>

          <motion.div
            className="absolute bg-white dark:bg-gray-800 rounded-full p-3 shadow-md"
            style={{ top: "15%", right: "15%" }}
            animate={{ rotate: 360 }}
            transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          >
            <Award className="h-6 w-6 text-primary" />
          </motion.div>
        </div>
      </div>

      {/* Floating device mockups */}
      <motion.div
        className="absolute bottom-10 left-10 w-48 h-32 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
      >
        <div className="h-4 bg-primary w-full"></div>
        <div className="p-2">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3"></div>
          <div className="mt-4 flex space-x-1">
            <div className="h-6 w-6 rounded-full bg-primary"></div>
            <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600"></div>
            <div className="h-6 w-6 rounded-full bg-gray-300 dark:bg-gray-600"></div>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="absolute top-10 right-10 w-40 h-60 bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="h-20 bg-gradient-to-r from-primary to-primary/70 w-full"></div>
        <div className="p-3">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-2/3 mb-4"></div>
          <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-md w-full mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full w-1/2"></div>
        </div>
      </motion.div>
    </div>
  )
}
