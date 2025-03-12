"use client"

import type React from "react"
import { useState } from "react"
import { FileText, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"

export default function AssignmentForge() {
  const [file, setFile] = useState<File | null>(null)
  const [solutionReady, setSolutionReady] = useState(false)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0])
    }
  }

  const processAssignment = () => {
    console.log("Processing assignment:", file?.name)
    setTimeout(() => setSolutionReady(true), 2000)
  }

  const downloadSolution = () => {
    console.log("Downloading solution")
    alert("Solution download started!")
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
    >
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">AssignmentForge</h2>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Upload your assignment (PDF, Word, or PPT)
        </label>
        <div className="flex items-center space-x-2">
          <Input type="file" onChange={handleFileUpload} accept=".pdf,.doc,.docx,.ppt,.pptx" />
          <Button onClick={processAssignment} disabled={!file}>
            <FileText className="mr-2 h-4 w-4" /> Process Assignment
          </Button>
        </div>
      </div>
      {solutionReady && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-green-100 dark:bg-green-800 p-4 rounded-lg"
        >
          <p className="text-green-800 dark:text-green-200 mb-2">Your assignment solution is ready!</p>
          <Button onClick={downloadSolution}>
            <Download className="mr-2 h-4 w-4" /> Download Solution
          </Button>
        </motion.div>
      )}
    </motion.div>
  )
}

