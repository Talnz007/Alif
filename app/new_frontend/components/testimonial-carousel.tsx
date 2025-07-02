"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronLeft, ChevronRight, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const testimonials = [
  {
    quote: "Alif made my exam prep 10x faster. The videos feel like a real tutor.",
    author: "Areeba Khan",
    role: "Computer Science Student, LUMS",
    avatar: "/placeholder.svg?height=50&width=50",
  },
  {
    quote: "No more jumping between Google, ChatGPT, and YouTube. It's all here.",
    author: "Hamza Raza",
    role: "Engineering Student, UET Lahore",
    avatar: "/placeholder.svg?height=50&width=50",
  },
  {
    quote: "The flashcards are perfect for memorizing medical terms. Saves me hours of manual work.",
    author: "Fizza Malik",
    role: "MBBS Student, Aga Khan University",
    avatar: "/placeholder.svg?height=50&width=50",
  },
  {
    quote: "Finally, an AI tool that actually understands what students need. Simple and powerful.",
    author: "Zayan Ahmed",
    role: "Business Student, IBA Karachi",
    avatar: "/placeholder.svg?height=50&width=50",
  },
]

export function TestimonialCarousel() {
  const [current, setCurrent] = useState(0)
  const [autoplay, setAutoplay] = useState(true)

  useEffect(() => {
    if (!autoplay) return

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [autoplay])

  const next = () => {
    setAutoplay(false)
    setCurrent((prev) => (prev + 1) % testimonials.length)
  }

  const prev = () => {
    setAutoplay(false)
    setCurrent((prev) => (prev - 1 + testimonials.length) % testimonials.length)
  }

  return (
    <div className="relative max-w-4xl mx-auto">
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-800 p-8 md:p-12 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center text-center"
          >
            <Quote className="h-12 w-12 text-indigo-300 dark:text-indigo-600 mb-6" />
            <blockquote className="text-xl md:text-2xl font-medium mb-8 text-gray-800 dark:text-gray-200">
              "{testimonials[current].quote}"
            </blockquote>
            <div className="flex flex-col items-center">
              <Avatar className="h-16 w-16 mb-4 border-2 border-white shadow-md">
                <AvatarImage
                  src={testimonials[current].avatar || "/placeholder.svg"}
                  alt={testimonials[current].author}
                />
                <AvatarFallback className="bg-indigo-100 text-indigo-600">
                  {testimonials[current].author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="text-center">
                <div className="font-semibold text-gray-800 dark:text-gray-200">{testimonials[current].author}</div>
                <div className="text-sm text-muted-foreground">{testimonials[current].role}</div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-center mt-6 space-x-2">
        <Button
          variant="outline"
          size="icon"
          onClick={prev}
          aria-label="Previous testimonial"
          className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20 bg-transparent"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {testimonials.map((_, index) => (
          <Button
            key={index}
            variant="ghost"
            size="icon"
            className={`w-3 h-3 rounded-full p-0 ${index === current ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"}`}
            onClick={() => {
              setAutoplay(false)
              setCurrent(index)
            }}
            aria-label={`Go to testimonial ${index + 1}`}
          />
        ))}
        <Button
          variant="outline"
          size="icon"
          onClick={next}
          aria-label="Next testimonial"
          className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20 bg-transparent"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
