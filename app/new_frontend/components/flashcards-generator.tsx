"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, ArrowRight, Shuffle, Download, Upload, FileText, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"

interface FlashcardsGeneratorProps {
  onClose: () => void
}

interface Flashcard {
  id: number
  front: string
  back: string
}

// Sample flashcards data as fallback
const SAMPLE_FLASHCARDS: Flashcard[] = []

export default function FlashcardsGenerator({ onClose }: FlashcardsGeneratorProps) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>(SAMPLE_FLASHCARDS)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [direction, setDirection] = useState<"left" | "right" | "none">("none")
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [promptText, setPromptText] = useState("")
  const [numFlashcards, setNumFlashcards] = useState(5)
  const touchStartX = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const currentCard = flashcards[currentIndex]

  const nextCard = () => {
    if (currentIndex < flashcards.length - 1) {
      setDirection("right")
      setFlipped(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1)
        setDirection("none")
      }, 300)
    }
  }

  const prevCard = () => {
    if (currentIndex > 0) {
      setDirection("left")
      setFlipped(false)
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1)
        setDirection("none")
      }, 300)
    }
  }

  const flipCard = () => {
    setFlipped(!flipped)
  }

  const shuffleCards = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5)
    setFlashcards(shuffled)
    setCurrentIndex(0)
    setFlipped(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return

    const touchEndX = e.changedTouches[0].clientX
    const diff = touchStartX.current - touchEndX

    // Swipe threshold
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextCard() // Swipe left
      } else {
        prevCard() // Swipe right
      }
    }

    touchStartX.current = null
  }

  const exportToAnki = () => {
    if (flashcards.length === 0) {
      setErrorMessage("No flashcards to export")
      return
    }

    const csvContent = "front,back\n" + flashcards.map((card) => `"${card.front}","${card.back}"`).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.setAttribute("download", "flashcards.csv")
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check if file is PDF
    if (file.type !== "application/pdf") {
      setErrorMessage("Please upload a PDF file")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      // Connect to FastAPI backend - using the new unified endpoint
      const response = await fetch("http://localhost:8000/api/v1/flashcards/upload-pdf", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()
      processFlashcardsResponse(data)
    } catch (error) {
      console.error("Error uploading PDF:", error)
      setErrorMessage(`Failed to upload or process PDF: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handlePromptSubmit = async () => {
    if (!promptText.trim()) {
      setErrorMessage("Please enter some text to generate flashcards")
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await fetch("http://localhost:8000/api/v1/flashcards/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: promptText,
          num_flashcards: numFlashcards
        }),
      })

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`)
      }

      const data = await response.json()
      processFlashcardsResponse(data)
    } catch (error) {
      console.error("Error generating flashcards:", error)
      setErrorMessage(`Failed to generate flashcards: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsLoading(false)
    }
  }

  const processFlashcardsResponse = (data: any) => {
    try {
      if (!data.flashcards || !Array.isArray(data.flashcards)) {
        throw new Error("Invalid response format")
      }

      // Convert to our Flashcard format with IDs
      const formattedFlashcards: Flashcard[] = data.flashcards.map((card: any, index: number) => ({
        id: index + 1,
        front: card.front || "",
        back: card.back || "",
      }))

      if (formattedFlashcards.length > 0) {
        setFlashcards(formattedFlashcards)
        setCurrentIndex(0)
        setFlipped(false)
      } else {
        throw new Error("No valid flashcards found in the response")
      }
    } catch (parseError) {
      console.error("Error processing flashcards:", parseError)
      setErrorMessage("Failed to process flashcards from the server response")
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <Tabs defaultValue="pdf" className="mb-6">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
          <TabsTrigger value="text">Enter Text</TabsTrigger>
        </TabsList>

        <TabsContent value="pdf" className="pt-4">
          <div className="rounded-lg border p-4 mb-6 bg-muted/30">
            <h3 className="text-lg font-medium mb-2">Upload a PDF Document</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload a PDF document to automatically generate flashcards from its content.
            </p>
            <div className="flex items-center gap-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf"
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={handleFileButtonClick}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" /> Select PDF
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="text" className="pt-4">
          <div className="rounded-lg border p-4 mb-6 bg-muted/30">
            <h3 className="text-lg font-medium mb-2">Enter Study Material</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter text to generate flashcards based on the content.
            </p>
            <Textarea
              placeholder="Enter your study notes, definitions, or any content you want to convert into flashcards..."
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              className="mb-4"
              rows={6}
            />

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Number of Flashcards</Label>
                  <span className="text-sm">{numFlashcards}</span>
                </div>
                <Slider
                  value={[numFlashcards]}
                  min={3}
                  max={15}
                  step={1}
                  onValueChange={(value) => setNumFlashcards(value[0])}
                />
              </div>

              <Button
                onClick={handlePromptSubmit}
                disabled={isLoading || !promptText.trim()}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  "Generate Flashcards"
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {errorMessage && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errorMessage}
        </div>
      )}

      {flashcards.length > 0 ? (
        <>
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm font-medium">
              Card {currentIndex + 1} of {flashcards.length}
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={shuffleCards}>
                <Shuffle className="h-4 w-4 mr-1" /> Shuffle
              </Button>
              <Button variant="outline" size="sm" onClick={exportToAnki}>
                <Download className="h-4 w-4 mr-1" /> Export
              </Button>
            </div>
          </div>

          <div
            className="relative h-80 w-full mb-6"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            style={{ perspective: "1000px" }}
          >
            <div
              className="w-full h-full relative cursor-pointer transition-transform duration-500"
              style={{
                transformStyle: "preserve-3d",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                transition: "transform 0.5s"
              }}
              onClick={flipCard}
            >
              {/* Front of card */}
              <div
                className="absolute inset-0 w-full h-full rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(0deg)"
                }}
              >
                <div className="flex flex-col items-center justify-center p-6 h-full">
                  <h3 className="text-2xl font-semibold mb-6 text-center">Question</h3>
                  <div className="flex-grow flex items-center justify-center w-full max-h-48 overflow-auto p-2">
                    <p className="text-gray-800 dark:text-gray-200 text-center text-lg">
                      {currentCard ? currentCard.front : "No card available"}
                    </p>
                  </div>
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                    Click to flip
                  </div>
                </div>
              </div>

              {/* Back of card */}
              <div
                className="absolute inset-0 w-full h-full rounded-xl shadow-lg overflow-hidden bg-gradient-to-br from-teal-50 to-blue-50 dark:from-teal-900/50 dark:to-blue-900/50"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)"
                }}
              >
                <div className="flex flex-col items-center justify-center p-6 h-full">
                  <h3 className="text-2xl font-semibold mb-6 text-center">Answer</h3>
                  <div className="flex-grow flex items-center justify-center w-full max-h-48 overflow-auto p-2">
                    <p className="text-gray-800 dark:text-gray-200 text-center text-lg">
                      {currentCard ? currentCard.back : "No card available"}
                    </p>
                  </div>
                  <div className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                    Click to flip
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between">
            <Button onClick={prevCard} disabled={currentIndex === 0 || flashcards.length <= 1} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" /> Previous
            </Button>
            <Button onClick={nextCard} disabled={currentIndex === flashcards.length - 1 || flashcards.length <= 1} variant="outline">
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </>
      ) : (
        <div className="text-center p-12 border border-dashed rounded-lg bg-muted/20">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-lg font-medium mb-2">No Flashcards Yet</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload a PDF or enter text to generate flashcards from your study material.
          </p>
        </div>
      )}
    </div>
  )
}