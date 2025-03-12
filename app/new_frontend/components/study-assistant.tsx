"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Book, WalletCardsIcon as Cards, FileText, FileSpreadsheet, Headphones, Presentation, Lock, Calculator } from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import QuizGenerator from "@/components/quiz-generator"
import FlashcardsGenerator from "@/components/flashcards-generator"
import SummaryGenerator from "@/components/summary-generator"
import DocumentUploader from "@/components/DocumentUploader"
import AudioUploader from "@/components/AudioUploader"
import { toast } from "@/components/ui/use-toast"
import MathSolver from "@/components/MathSolver";

export default function StudyAssistant() {
  const [generatedContent, setGeneratedContent] = useState<string>("")
  const [quizModalOpen, setQuizModalOpen] = useState(false)
  const [flashcardsModalOpen, setFlashcardsModalOpen] = useState(false)
  const [summaryModalOpen, setSummaryModalOpen] = useState(false)
  const [documentModalOpen, setDocumentModalOpen] = useState(false)
  const [audioModalOpen, setAudioModalOpen] = useState(false)
  const [presentationModalOpen, setPresentationModalOpen] = useState(false)
  const [mathSolverModalOpen, setMathSolverModalOpen] = useState(false)

  const generateContent = (type: "summary" | "quiz" | "flashcards" | "document" | "audio" | "presentation" | "mathsolver") => {
    if (type === "summary") {
      setSummaryModalOpen(true);
    } else if (type === "quiz") {
      setQuizModalOpen(true);
    } else if (type === "flashcards") {
      setFlashcardsModalOpen(true);
    } else if (type === "document") {
      setDocumentModalOpen(true);
    } else if (type === "audio") {
      setAudioModalOpen(true);
    } else if (type === "presentation") {
      toast({
        title: "Coming Soon!",
        description: "Presentation tools will be available in the next update.",
        variant: "default",
      });
      setPresentationModalOpen(true);
    } else if (type === "mathsolver") {
      setMathSolverModalOpen(true);
    }
  }

  return (
    <div className="p-8 content-layer rounded-xl shadow-lg h-full">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Study Assistant
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Transform your study materials into interactive learning experiences
            </p>
          </div>
          <div className="h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <Book className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          {/* Each card uses flex-col and h-full to ensure equal height */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <Book className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Summarization</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Get concise summaries of your study materials with key points highlighted
            </p>
            <div className="mt-auto">
              <Button
                onClick={() => generateContent("summary")}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Generate Summary
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                AI-Powered
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Quiz Generator</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Create interactive quizzes to test your knowledge effectively
            </p>
            <div className="mt-auto">
              <Button
                onClick={() => generateContent("quiz")}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Generate Quiz
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-900/50 dark:to-teal-900/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <Cards className="h-8 w-8 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400 px-2 py-1 rounded-full">
                New Feature
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Flashcards</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Transform your notes into interactive flashcards for better retention
            </p>
            <div className="mt-auto">
              <Button
                onClick={() => generateContent("flashcards")}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Generate Flashcards
              </Button>
            </div>
          </motion.div>

          {/* Math Problem Solver Card - Now Available */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/50 dark:to-orange-900/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-4 relative z-10">
              <Calculator className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-full">
                NEW
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 relative z-10">Math Problem Solver</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 relative z-10">
              Upload math questions and get step-by-step solutions with detailed explanations
            </p>
            <div className="mt-auto relative z-10">
              <Button
                onClick={() => generateContent("mathsolver")}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                Solve Math Problems
              </Button>
            </div>
          </motion.div>

          {/* Audio Processor Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/50 dark:to-blue-900/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <Headphones className="h-8 w-8 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-medium bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400 px-2 py-1 rounded-full">
                Audio Analysis
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Audio Processor</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Upload audio files to get transcriptions and summaries
            </p>
            <div className="mt-auto">
              <Button
                onClick={() => generateContent("audio")}
                className="w-full bg-cyan-600 hover:bg-cyan-700"
              >
                Process Audio
              </Button>
            </div>
          </motion.div>

          {/* Presentation Tools Card - COMING SOON */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/50 dark:to-red-900/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full"
          >
            {/* Fix: Adjusted triangle to not overlap text */}
            <div className="absolute -right-12 -top-12 w-28 h-28 bg-gradient-to-br from-rose-400 to-orange-400 dark:from-rose-600 dark:to-orange-600 rotate-45 transform origin-bottom-left z-0"></div>
            <div className="absolute top-6 right-6 z-10">
              <span className="text-xs font-bold bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-full flex items-center">
                <Lock className="h-3 w-3 mr-1" />
                COMING SOON
              </span>
            </div>
            <div className="flex items-center justify-between mb-4 relative z-10">
              <Presentation className="h-8 w-8 text-rose-600 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2 relative z-10">Presentation Tools</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 relative z-10">
              Create slideshows from PDFs and generate explainer videos automatically
            </p>
            <div className="mt-auto relative z-10">
              <Button
                onClick={() => generateContent("presentation")}
                className="w-full bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600"
              >
                Explore Tools
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Summary Generator Modal */}
      <Dialog open={summaryModalOpen} onOpenChange={setSummaryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Text Summarizer</DialogTitle>
          </DialogHeader>
          <SummaryGenerator onClose={() => setSummaryModalOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Quiz Generator Modal */}
      <Dialog open={quizModalOpen} onOpenChange={setQuizModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interactive Quiz</DialogTitle>
          </DialogHeader>
          <QuizGenerator onClose={() => setQuizModalOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Flashcards Modal */}
      <Dialog open={flashcardsModalOpen} onOpenChange={setFlashcardsModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Interactive Flashcards</DialogTitle>
          </DialogHeader>
          <FlashcardsGenerator onClose={() => setFlashcardsModalOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Document Processor Modal */}
      <Dialog open={documentModalOpen} onOpenChange={setDocumentModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Document Processor</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <DocumentUploader />
          </div>
        </DialogContent>
      </Dialog>

      {/* Audio Processor Modal */}
      <Dialog open={audioModalOpen} onOpenChange={setAudioModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Audio Processor</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <AudioUploader />
          </div>
        </DialogContent>
      </Dialog>


      <Dialog open={mathSolverModalOpen} onOpenChange={setMathSolverModalOpen}>
        <DialogContent className="max-w-[90vw] w-[1200px] max-h-[90vh] h-[800px] overflow-hidden p-0 dark:bg-gray-900">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Calculator className="h-6 w-6" />
              Math Problem Solver
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 overflow-y-auto" style={{ height: "calc(100% - 60px)" }}>
            <MathSolver onClose={() => setMathSolverModalOpen(false)} />
          </div>
        </DialogContent>
      </Dialog>

      {/* Presentation Tools Preview Modal */}
      <Dialog open={presentationModalOpen} onOpenChange={setPresentationModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Presentation className="h-6 w-6" />
              Presentation Tools Preview
            </DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-medium text-rose-700 dark:text-rose-300 mb-2">
                Coming in the Next Update
              </h3>
              <p className="text-rose-600 dark:text-rose-400 text-sm">
                We're working hard to bring you powerful presentation tools. Here's what to expect:
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                  <FileSpreadsheet className="h-4 w-4 text-amber-500" />
                  PPTX Generator
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Automatically generate professional presentations from your study materials and notes.
                  Export as PowerPoint or Google Slides.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-900 dark:text-white">
                  <FileText className="h-4 w-4 text-cyan-500" />
                  PDF to Explainer Videos
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Transform your PDF documents into engaging explainer videos with narration
                  and animated slides.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-2 text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Lock className="h-4 w-4 mr-2 text-gray-400" />
                Expected release: May 2025
              </div>
            </div>

            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={() => setPresentationModalOpen(false)}
              >
                Close Preview
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}