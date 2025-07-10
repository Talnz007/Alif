"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Book, FileText, Sparkles, Brain, CalendarClock, BarChart3, LightbulbIcon, PencilIcon, ListTodo } from "lucide-react"
import { motion } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import AssignmentGenerator from "@/components/assignment-generator"
import AssignmentSolver from "@/components/assignment-solver"
import { useSearchParams, useRouter } from "next/navigation"

export default function AssignmentsPage() {
  const [generatorModalOpen, setGeneratorModalOpen] = useState(false)
  const [solverModalOpen, setSolverModalOpen] = useState(false)

  const router = useRouter()
  const searchParams = useSearchParams()

  // Handle URL parameter for opening specific modals
  useEffect(() => {
  if (!searchParams) return;
  if (searchParams.get('tool') === 'solver') {
    setSolverModalOpen(true)
  } else if (searchParams.get('tool') === 'generator') {
    setGeneratorModalOpen(true)
  }
}, [searchParams])

  const openTool = (tool: 'generator' | 'solver') => {
    if (tool === 'generator') {
      setGeneratorModalOpen(true)
      router.push('/assignments?tool=generator', { scroll: false })
    } else if (tool === 'solver') {
      setSolverModalOpen(true)
      router.push('/assignments?tool=solver', { scroll: false })
    }
  }

  return (
    <div className="p-8 content-layer rounded-xl shadow-lg h-full">
      <div className="w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4"
        >
          <div>
            <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">
              Assignment Workshop
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Create, solve, and master academic assignments with AI assistance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
              <CalendarClock className="mr-1 h-3 w-3" /> {new Date().toLocaleDateString()}
            </Badge>
            <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        {/* Main Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {/* Assignment Generator Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/50 dark:to-pink-900/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <FileText className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              <span className="text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-full">
                AI-Powered
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Assignment Generator</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Create customized assignments with various difficulty levels and formats based on any topic
            </p>
            <div className="mt-auto">
              <Button
                onClick={() => openTool('generator')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Generate Assignment
              </Button>
            </div>
          </motion.div>

          {/* Assignment Solver Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/50 dark:to-indigo-900/50 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <Sparkles className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                Problem Solver
              </span>
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">Assignment Solver</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Get intelligent solutions for your assignments with step-by-step explanations and downloadable PDFs
            </p>
            <div className="mt-auto">
              <Button
                onClick={() => openTool('solver')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Solve Assignment
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Coming Soon Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Coming Soon</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="font-medium">Progress Tracking</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Monitor your academic progress with visual analytics
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <LightbulbIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <h4 className="font-medium">Smart Recommendations</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Get personalized study tips based on your assignment history
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <PencilIcon className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h4 className="font-medium">Assignment Templates</h4>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Access a library of pre-made templates for common assignment types
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Generator Modal */}
      <Dialog open={generatorModalOpen} onOpenChange={setGeneratorModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <FileText className="h-5 w-5" /> Assignment Generator
            </DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <AssignmentGenerator />
          </div>
        </DialogContent>
      </Dialog>

      {/* Solver Modal */}
      <Dialog open={solverModalOpen} onOpenChange={setSolverModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5" /> Assignment Solver
            </DialogTitle>
          </DialogHeader>
          <div className="p-2">
            <AssignmentSolver />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}