"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { FileDown, ChevronDown, ChevronUp, Lightbulb, BookOpen, Loader2, Award } from "lucide-react"
import { motion } from "framer-motion"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/hooks/use-user"
import { trackActivity, awardPoints } from "@/lib/activity-logger"
import { ToastAction } from "@/components/ui/toast"
import { ActivityType, ActivityMetadata } from "@/lib/utils/activity-types";

// Interface definitions
interface AssignmentTask {
  id: string
  title: string
  description: string
  reference?: string
  solution?: string
  hints?: string
}

export default function AssignmentGenerator() {
  const [topic, setTopic] = useState("")
  const [assignmentType, setAssignmentType] = useState("mixed")
  const [difficulty, setDifficulty] = useState("medium")
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedAssignment, setGeneratedAssignment] = useState<AssignmentTask[] | null>(null)
  const [openSolutions, setOpenSolutions] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)
  const [pointsAwarded, setPointsAwarded] = useState(false)
  const { toast } = useToast()
  const { user } = useUser()

  const toggleSolution = (id: string) => {
    setOpenSolutions((prev) => ({
      ...prev,
      [id]: !prev[id],
    }))
  }

  const generateAssignment = async () => {
    if (!topic) {
      setError("Please enter a topic")
      return
    }

    setIsGenerating(true)
    setError(null)
    setGeneratedAssignment(null)
    setPointsAwarded(false) // Reset points awarded state

    try {
      const response = await fetch("http://localhost:8000/api/v1/assignment/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(user?.id ? {"x-user-id": user.id} : {})
        },
        body: JSON.stringify({
          text: topic,
          assignment_type: assignmentType,
          num_tasks: 3,
          difficulty: difficulty,
          output_format: "json"
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      // Transform backend data to match our frontend structure
      const formattedTasks: AssignmentTask[] = data.tasks.map((task: any, index: number) => ({
        id: `task-${index + 1}`,
        title: task.title || `Task ${index + 1}`,
        description: task.description || "",
        reference: task.reference || "No specific reference provided.",
        hints: task.hints || "Focus on the key concepts from the source material.",
        solution: task.solution || "Solution not available"
      }))

      setGeneratedAssignment(formattedTasks)

      toast({
        title: "Assignment Generated",
        description: `Your ${assignmentType} assignment has been created successfully.`,
      })

      // Gamification tracking - track activity and award points
      if (formattedTasks.length > 0 && user?.id) {
        try {
          // Track assignment generation activity
          await trackActivity(user.id, ActivityType.ASSIGNMENT_STARTED, {
            topic,
            assignmentType,
            difficulty,
            taskCount: formattedTasks.length,
            generatedAt: new Date().toISOString()
          })

          // Award a small number of points for generating an assignment
          await awardPoints(user.id, 5, "Assignment generated", {
            topic,
            assignmentType,
            difficulty
          })

          setPointsAwarded(true)

          // Show points toast after a small delay
          setTimeout(() => {
            toast({
                title: "Points Earned!",
                description: "You earned 5 points for generating an assignment.",
                variant: "default",
                action: <ToastAction altText="View">
                  <Award className="h-5 w-5 text-amber-500" />
                </ToastAction>,
              })
          }, 1000)
        } catch (error) {
          console.error("Error tracking assignment generation:", error)
          // Don't show error to user, we already have the generated assignment
        }
      }
    } catch (error) {
      console.error("Error generating assignment:", error)
      setError(`Failed to generate assignment: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  const exportAsPDF = async () => {
    if (!topic) {
      setError("Please enter a topic")
      return
    }

    try {
      setIsGenerating(true)

      const response = await fetch("http://localhost:8000/api/v1/assignment/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: topic,
          assignment_type: assignmentType,
          num_tasks: 3,
          difficulty: difficulty,
          output_format: "pdf"
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      // Create blob from the PDF response
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)

      // Create download link and trigger download
      const a = document.createElement("a")
      a.href = url
      a.download = `assignment_${topic.substring(0, 20).replace(/\s+/g, "_")}.pdf`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "PDF Downloaded",
        description: "Your assignment has been downloaded as a PDF.",
      })
    } catch (error) {
      console.error("Error exporting PDF:", error)
      setError(`Failed to export PDF: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Collapsible className="w-full">
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2 h-5 w-5" /> Assignment Generator
            </CardTitle>
            <ChevronDown className="h-5 w-5" />
          </CollapsibleTrigger>
          <CardDescription>Generate customized assignments based on your topic and preferences</CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Textarea
                    id="topic"
                    placeholder="e.g., Artificial Intelligence or paste specific content here"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Assignment Type</Label>
                  <Select value={assignmentType} onValueChange={setAssignmentType}>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="essay">Essay</SelectItem>
                      <SelectItem value="mcq">Multiple Choice Questions</SelectItem>
                      <SelectItem value="mixed">Mixed Format</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger id="difficulty">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                  <p>{error}</p>
                </div>
              )}

              <Button onClick={generateAssignment} disabled={!topic || isGenerating} className="w-full">
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Generating...
                  </>
                ) : (
                  "Generate Assignment"
                )}
              </Button>

              {generatedAssignment && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-6 space-y-4"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold flex items-center">
                      <span>Generated Assignment:</span>
                      <span className="ml-2 truncate text-base">
                        {topic.length > 30 ? `${topic.substring(0, 30)}...` : topic}
                      </span>
                      {pointsAwarded && (
                        <span className="ml-2 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 text-xs px-2 py-1 rounded-full flex items-center">
                          <Award className="h-3 w-3 mr-1" /> +5 points
                        </span>
                      )}
                    </h3>
                    <Button variant="outline" size="sm" onClick={exportAsPDF} disabled={isGenerating}>
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <FileDown className="h-4 w-4 mr-2" />
                      )}
                      Export as PDF
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {generatedAssignment.map((task) => (
                      <Card key={task.id} className="overflow-hidden">
                        <CardHeader className="bg-gray-50 dark:bg-gray-800">
                          <CardTitle className="text-lg">{task.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="space-y-4">
                            <div>
                              <h4 className="font-medium mb-2">Description:</h4>
                              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-line">
                                {task.description}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-medium mb-2">Reference:</h4>
                              <div className="text-gray-700 dark:text-gray-300">
                                {task.reference}
                              </div>
                            </div>

                            <Collapsible
                              open={openSolutions[task.id]}
                              onOpenChange={() => toggleSolution(task.id)}
                            >
                              <div className="border rounded-lg p-3 bg-amber-50 dark:bg-amber-900/20">
                                <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
                                  <div className="flex items-center text-amber-800 dark:text-amber-300">
                                    <Lightbulb className="h-4 w-4 mr-2" /> Hints & Solution
                                  </div>
                                  {openSolutions[task.id] ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-2 space-y-2">
                                  {task.hints && (
                                    <div>
                                      <h5 className="font-medium text-sm">Hints:</h5>
                                      <p className="text-sm text-gray-700 dark:text-gray-300">{task.hints}</p>
                                    </div>
                                  )}
                                  {task.solution && (
                                    <div>
                                      <h5 className="font-medium text-sm">Solution:</h5>
                                      <div className="text-sm text-gray-700 dark:text-gray-300">{task.solution}</div>
                                    </div>
                                  )}
                                </CollapsibleContent>
                              </div>
                            </Collapsible>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}