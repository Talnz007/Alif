"use client"

import Link from "next/link"

import { useState } from "react"
import { motion } from "framer-motion"
import { ArrowLeft, ArrowRight, RotateCcw, Upload, Sparkles, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const sampleFlashcards = [
  {
    id: 1,
    front: "What's the derivative of sin(x)?",
    back: "cos(x)",
    subject: "Calculus",
  },
  {
    id: 2,
    front: "What does DNA stand for?",
    back: "Deoxyribonucleic Acid",
    subject: "Biology",
  },
  {
    id: 3,
    front: "What is the capital of France?",
    back: "Paris",
    subject: "Geography",
  },
  {
    id: 4,
    front: "What is the formula for kinetic energy?",
    back: "KE = ½mv²",
    subject: "Physics",
  },
]

export function InteractiveFlashcards() {
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const nextCard = () => {
    setIsFlipped(false)
    setCurrentCard((prev) => (prev + 1) % sampleFlashcards.length)
  }

  const prevCard = () => {
    setIsFlipped(false)
    setCurrentCard((prev) => (prev - 1 + sampleFlashcards.length) % sampleFlashcards.length)
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const resetCards = () => {
    setCurrentCard(0)
    setIsFlipped(false)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Process Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-indigo-100 dark:border-indigo-800">
          <div className="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center mx-auto mb-4">
            <Upload className="h-6 w-6 text-indigo-600" />
          </div>
          <h3 className="font-semibold mb-2">1. Upload Content</h3>
          <p className="text-sm text-muted-foreground">PDFs, notes, or lecture text — anything goes.</p>
        </div>

        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-100 dark:border-orange-800">
          <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="font-semibold mb-2">2. AI Highlights Key Concepts</h3>
          <p className="text-sm text-muted-foreground">Important terms, formulas, and facts are pulled out.</p>
        </div>

        <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 border border-green-100 dark:border-green-800">
          <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mx-auto mb-4">
            <Target className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="font-semibold mb-2">3. Flashcards, Instantly</h3>
          <p className="text-sm text-muted-foreground">Review on the go. Practice with spaced repetition.</p>
        </div>
      </div>

      {/* Interactive Flashcard Demo */}
      <div className="relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-4">
            ✅ Example Cards
          </div>
          <p className="text-muted-foreground">Click the card to flip it and see the answer</p>
        </div>

        <div className="flex justify-center mb-8">
          <div className="relative w-full max-w-md h-64 perspective-1000">
            <motion.div
              className="relative w-full h-full cursor-pointer"
              onClick={flipCard}
              style={{ transformStyle: "preserve-3d" }}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
            >
              {/* Front of card */}
              <Card className="absolute inset-0 w-full h-full backface-hidden border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                <CardContent className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50">
                  <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 mb-2 uppercase tracking-wide">
                    {sampleFlashcards[currentCard].subject}
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-4">Question</h3>
                  <p className="text-center text-lg">{sampleFlashcards[currentCard].front}</p>
                  <div className="absolute bottom-4 text-xs text-muted-foreground">Click to reveal answer</div>
                </CardContent>
              </Card>

              {/* Back of card */}
              <Card
                className="absolute inset-0 w-full h-full backface-hidden border-2 border-orange-200 dark:border-orange-800 shadow-lg"
                style={{ transform: "rotateY(180deg)" }}
              >
                <CardContent className="flex flex-col items-center justify-center h-full p-6 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50">
                  <div className="text-xs font-medium text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wide">
                    {sampleFlashcards[currentCard].subject}
                  </div>
                  <h3 className="text-xl font-semibold text-center mb-4">Answer</h3>
                  <p className="text-center text-lg font-medium">{sampleFlashcards[currentCard].back}</p>
                  <div className="absolute bottom-4 text-xs text-muted-foreground">Click to see question</div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center space-x-4 mb-8">
          <Button
            variant="outline"
            size="icon"
            onClick={prevCard}
            className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20 bg-transparent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex space-x-2">
            {sampleFlashcards.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentCard ? "bg-indigo-600" : "bg-gray-300 dark:bg-gray-600"
                }`}
                onClick={() => {
                  setCurrentCard(index)
                  setIsFlipped(false)
                }}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={nextCard}
            className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20 bg-transparent"
          >
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="text-center">
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={resetCards}
              className="border-indigo-200 hover:bg-indigo-50 dark:border-indigo-800 dark:hover:bg-indigo-900/20 bg-transparent"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button
              asChild
              className="bg-gradient-to-r from-indigo-600 to-orange-500 hover:from-indigo-700 hover:to-orange-600"
            >
              <Link href="/register" target="_blank">
                Create Your Own Flashcards
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
