"use client"

import type React from "react"
import { useState } from "react"
import { FileAudio, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { motion } from "framer-motion"

export default function LectureDigest() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [question, setQuestion] = useState("")
  const [transcript, setTranscript] = useState("")
  const [summary, setSummary] = useState("")

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setAudioFile(event.target.files[0])
    }
  }

  const processAudio = () => {
    console.log("Processing audio:", audioFile?.name)
    setTranscript("This is a sample transcript of the uploaded audio...")
    setSummary("This is a sample summary of the lecture...")
  }

  const askQuestion = () => {
    console.log("Asking question:", question)
    alert("This is a sample answer to your question: " + question)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">LectureDigest</h2>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Upload your lecture audio
        </label>
        <div className="flex items-center space-x-2">
          <Input type="file" onChange={handleFileUpload} accept="audio/*" />
          <Button onClick={processAudio} disabled={!audioFile}>
            <FileAudio className="mr-2 h-4 w-4" /> Process Audio
          </Button>
        </div>
      </div>
      {transcript && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Transcript</h3>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-800 dark:text-gray-200">{transcript}</p>
          </div>
        </motion.div>
      )}
      {summary && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mb-6"
        >
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Summary</h3>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <p className="text-gray-800 dark:text-gray-200">{summary}</p>
          </div>
        </motion.div>
      )}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Ask a question about the lecture
        </label>
        <div className="flex items-center space-x-2">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Type your question here..."
            className="flex-grow"
          />
          <Button onClick={askQuestion} disabled={!question}>
            <MessageSquare className="mr-2 h-4 w-4" /> Ask
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

