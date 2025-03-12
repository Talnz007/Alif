"use client"

import type React from "react"
import { useState } from "react"
import { Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

export default function BrainBoostQuiz() {
  const [file, setFile] = useState<File | null>(null)
  const [quizGenerated, setQuizGenerated] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  const generateQuiz = () => {
    console.log("Generating quiz from:", file?.name)
    setQuizGenerated(true)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">BrainBoost Quiz</h2>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Upload your notes or book PDF
        </label>
        <div className="flex items-center space-x-2">
          <Input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.txt" />
          <Button onClick={generateQuiz} disabled={!file}>
            <Play className="mr-2 h-4 w-4" /> Generate Quiz
          </Button>
        </div>
      </div>
      {quizGenerated && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-green-100 dark:bg-green-800 p-4 rounded-lg"
        >
          <p className="text-green-800 dark:text-green-200">
            Quiz generated successfully! You can now start your quiz.
          </p>
          <Button className="mt-2">
            <Play className="mr-2 h-4 w-4" /> Start Quiz
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

