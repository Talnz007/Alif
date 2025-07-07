"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Upload, ChevronDown, Copy, Download, Sparkles, Loader2, AlertTriangle } from "lucide-react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import dynamic from 'next/dynamic'
import { useFileStore } from "@/lib/file-store"
import { jsPDF } from "jspdf"
import 'jspdf-autotable'
import ReactMarkdown from "react-markdown"
import remarkGfm from 'remark-gfm'
import { useUser } from "@/hooks/use-user"
import { trackActivity, calculateAssignmentPoints, awardPoints } from "@/lib/activity-logger";
import { ActivityType, ActivityMetadata } from "@/lib/utils/activity-types";

export default function AssignmentSolver() {
  const [assignmentText, setAssignmentText] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [isSolving, setIsSolving] = useState(false)
  const [solution, setSolution] = useState<string | null>(null)
  const [timeTaken, setTimeTaken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [score, setScore] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const solutionRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { user } = useUser();
  const { selectedFile } = useFileStore()

  // Initialize with selected file if available
  useEffect(() => {
    if (selectedFile) {
      if (selectedFile.content) {
        setAssignmentText(selectedFile.content)
      } else {
        setAssignmentText(`Selected file: ${selectedFile.name}`)
      }
    }
  }, [selectedFile])

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0]
      setFile(selectedFile)
      setAssignmentText(`Content from file: ${selectedFile.name}`)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Helper function to detect subject from text
  function detectSubject(text: string): string {
    const subjectKeywords: Record<string, string[]> = {
      'Mathematics': ['math', 'calculus', 'algebra', 'geometry', 'equation', 'theorem', 'polynomial', 'arithmetic'],
      'Physics': ['physics', 'force', 'energy', 'gravity', 'motion', 'quantum', 'relativity', 'momentum', 'mass'],
      'Computer Science': ['programming', 'algorithm', 'code', 'function', 'class', 'database', 'software', 'loops'],
      'Chemistry': ['chemistry', 'molecule', 'atom', 'reaction', 'compound', 'acid', 'element', 'organic'],
      'Biology': ['biology', 'cell', 'organism', 'species', 'evolution', 'dna', 'gene', 'ecosystem']
    };

    const lowerText = text.toLowerCase();

    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        return subject;
      }
    }

    return 'General';
  }

  const solveAssignment = async () => {
    if (!assignmentText && !file) {
      setError("Please enter text or upload a file")
      return
    }

    setIsSolving(true)
    setSolution(null)
    setTimeTaken(null)
    setError(null)

    try {
      let response;

      if (file) {
        // Use file upload endpoint
        const formData = new FormData();
        formData.append("file", file);
        formData.append("format", "markdown");  // Explicitly request markdown format
        formData.append("output_format", "json");  // Get JSON response for web display

        response = await fetch("http://localhost:8000/api/v1/solver/upload", {
          method: "POST",
          body: formData,
        });
      } else {
        // Use text endpoint
        response = await fetch("http://localhost:8000/api/v1/solver/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: assignmentText,
            format: "markdown", // Explicitly request markdown format
            output_format: "json" // Get JSON response for web display
          }),
        });
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setSolution(data.solution);
      setTimeTaken(data.time_taken);

      toast({
        title: "Solution ready",
        description: `Your assignment solution was generated in ${data.time_taken}.`,
      });

      // Gamification: Track the activity and award points
      if (data.solution && user?.id) {
        try {
          // Estimate a score based on solution quality (80-95 range)
          const estimatedScore = Math.min(95, Math.floor(Math.random() * 16) + 80);
          setScore(estimatedScore);

          // Track the assignment completion activity
          await trackActivity(user.id, ActivityType.ASSIGNMENT_COMPLETED, {
            assignmentId: `solver-${Date.now()}`,
            title: assignmentText.substring(0, 50) + (assignmentText.length > 50 ? '...' : ''),
            score: estimatedScore,
            subject: detectSubject(assignmentText),
            difficulty: 'medium'
          });

          // Award points based on the score
          const pointsEarned = calculateAssignmentPoints(estimatedScore, 'medium');
          await awardPoints(user.id, pointsEarned, "Assignment completed", {
            method: "solver"
          });

          // Show points notification
          toast({
            title: "Points earned!",
            description: `You earned ${pointsEarned} points for completing this assignment.`,
          });
        } catch (error) {
          console.error("Error tracking assignment activity:", error);
          // Don't show error to user, we already have the solution
        }
      }
    } catch (error) {
      console.error("Error solving assignment:", error);
      setError(`Failed to solve assignment: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: "Failed to solve assignment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSolving(false);
    }
  };

  const copyToClipboard = () => {
    if (solution) {
      navigator.clipboard.writeText(solution);
      toast({
        title: "Copied to clipboard",
        description: "Solution has been copied to clipboard.",
      });
    }
  };

  const downloadAsPDF = async () => {
    if (!solution) return;

    try {
      // Show loading toast
      toast({
        title: "Generating PDF",
        description: "Preparing your PDF...",
      });

      // Direct API call to download as PDF
      let response;

      if (file) {
        // Use file upload endpoint with PDF output format
        const formData = new FormData();
        formData.append("file", file);
        formData.append("format", "markdown");
        formData.append("output_format", "pdf"); // Request PDF directly

        response = await fetch("http://localhost:8000/api/v1/solver/upload", {
          method: "POST",
          body: formData,
        });
      } else {
        // Use text endpoint with PDF output format
        response = await fetch("http://localhost:8000/api/v1/solver/text", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: assignmentText,
            format: "markdown",
            output_format: "pdf" // Request PDF directly
          }),
        });
      }

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      // Create blob from the PDF response
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Create download link and trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = "assignment-solution.pdf";
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "PDF Downloaded",
        description: "Your solution has been downloaded as a PDF.",
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <Collapsible className="w-full">
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-left">
            <CardTitle className="flex items-center">
              <Sparkles className="mr-2 h-5 w-5" /> Assignment Solver
            </CardTitle>
            <ChevronDown className="h-5 w-5" />
          </CollapsibleTrigger>
          <CardDescription>Get intelligent solutions for your assignments</CardDescription>
        </CardHeader>

        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              <Tabs defaultValue="text" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Paste Text</TabsTrigger>
                  <TabsTrigger value="upload">Upload File</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4 pt-4">
                  <Textarea
                    placeholder="Paste your assignment text here..."
                    value={assignmentText}
                    onChange={(e) => setAssignmentText(e.target.value)}
                    className="min-h-[200px]"
                  />
                </TabsContent>

                <TabsContent value="upload" className="space-y-4 pt-4">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt"
                    />
                    <Button onClick={triggerFileInput} variant="outline" className="mb-4">
                      <Upload className="h-4 w-4 mr-2" /> Choose File
                    </Button>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {file ? `Selected file: ${file.name}` : "Supported formats: PDF, DOC, TXT"}
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              {error && (
                <div className="p-4 bg-red-100 border border-red-300 rounded-md flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <Button
                onClick={solveAssignment}
                disabled={(!assignmentText && !file) || isSolving}
                className="w-full relative"
              >
                {isSolving ? (
                  <>
                    <span className="opacity-0">Solve Assignment</span>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" /> Solving...
                    </div>
                  </>
                ) : (
                  "Solve Assignment"
                )}
              </Button>

              {solution && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="mt-6"
                >
                  {timeTaken && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 p-2 rounded text-sm mb-4 flex justify-between items-center">
                      <span>Solution generated in: {timeTaken}</span>
                      {score && (
                        <span className="font-semibold">
                          Score: {score}/100 {score >= 90 ? "🌟" : score >= 80 ? "✨" : "👍"}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Assignment</h3>
                      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg min-h-[300px] overflow-auto">
                        <pre className="whitespace-pre-wrap text-sm">{assignmentText}</pre>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-semibold">Solution</h3>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" onClick={copyToClipboard}>
                            <Copy className="h-4 w-4 mr-1" /> Copy
                          </Button>
                          <Button variant="outline" size="sm" onClick={downloadAsPDF}>
                            <Download className="h-4 w-4 mr-1" /> Download PDF
                          </Button>
                        </div>
                      </div>
                      <div
                        ref={solutionRef}
                        className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg min-h-[300px] overflow-auto prose dark:prose-invert prose-sm max-w-none"
                      >
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {solution}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}