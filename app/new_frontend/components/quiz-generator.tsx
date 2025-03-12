"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, ArrowRight, RotateCcw, Upload, Loader2, FileText } from "lucide-react"

interface QuizGeneratorProps {
  onClose: () => void
}

interface QuizQuestion {
  id: number
  question: string
  type: "multiple-choice" | "true-false" | "short-answer"
  options?: string[]
  correctAnswer: string
}

// Define the shape of the data coming from your backend
interface BackendQuizResponse {
  quiz: Array<{
    question_type: string
    question: string
    options: string[] | null
    answer: string
  }>
}

export default function QuizGenerator({ onClose }: QuizGeneratorProps) {
  const [stage, setStage] = useState<"setup" | "loading" | "quiz" | "results">("setup")
  const [topic, setTopic] = useState("")
  const [numQuestions, setNumQuestions] = useState(5)
  const [difficulty, setDifficulty] = useState("medium")
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [shortAnswer, setShortAnswer] = useState<string>("")
  const [answers, setAnswers] = useState<{ questionId: number; userAnswer: string; correct: boolean }[]>([])
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [error, setError] = useState<string | null>(null)
  const [inputMethod, setInputMethod] = useState<"text" | "pdf">("text")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)

  const currentQuestion = questions[currentQuestionIndex]
  const isLastQuestion = currentQuestionIndex === questions.length - 1

  const handleFileButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      if (selectedFile.type !== "application/pdf") {
        setError("Please upload a PDF file")
        return
      }

      setFile(selectedFile)
      setError(null)
    }
  }

  const fetchQuestions = async () => {
    setStage("loading")
    setError(null)

    try {
      let response;

      if (inputMethod === "text") {
        // Text-based quiz generation
        response = await fetch("http://127.0.0.1:8000/api/v1/quiz/generate", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: topic || "General knowledge",
            num_questions: numQuestions,
            difficulty: difficulty,
          }),
        })
      } else {
        // PDF upload quiz generation
        if (!file) {
          throw new Error("No PDF file selected")
        }

        const formData = new FormData()
        formData.append("file", file)
        formData.append("num_questions", numQuestions.toString())
        formData.append("difficulty", difficulty)

        response = await fetch("http://127.0.0.1:8000/api/v1/quiz/upload-pdf", {
          method: "POST",
          body: formData,
        })
      }

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! Status: ${response.status}, Details: ${errorText}`)
      }

      const data: BackendQuizResponse = await response.json()

      if (!data.quiz || !Array.isArray(data.quiz) || data.quiz.length === 0) {
        throw new Error("Invalid or empty quiz data received")
      }

      // Transform the backend data format to match our frontend format
      const formattedQuestions: QuizQuestion[] = data.quiz.map((q, index) => ({
        id: index + 1,
        question: q.question,
        type: q.question_type === "multiple_choice" ? "multiple-choice" :
              q.question_type === "true_false" ? "true-false" : "short-answer",
        options: q.options || (q.question_type === "true_false" ? ["True", "False"] : undefined),
        correctAnswer: q.answer,
      }))

      setQuestions(formattedQuestions)
      setStage("quiz")
    } catch (error) {
      console.error("Failed to fetch questions:", error)
      setError(`Failed to load quiz questions: ${error instanceof Error ? error.message : String(error)}. Please try again.`)
      setStage("setup")
    }
  }

  // Add a timeout to automatically exit loading state if it gets stuck
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (stage === "loading") {
      timeoutId = setTimeout(() => {
        console.log("Loading timeout reached. Returning to setup stage.");
        setError("Request timed out. Please check your network connection and try again.");
        setStage("setup");
      }, 15000); // 15 seconds timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [stage]);

  const startQuiz = () => {
    setError(null);

    // Validate input based on selected method
    if (inputMethod === "pdf" && !file) {
      setError("Please upload a PDF file first");
      return;
    }

    if (inputMethod === "text" && !topic.trim()) {
      setError("Please enter a topic or content for the quiz");
      return;
    }

    fetchQuestions();
  }

  const checkAnswer = () => {
    if (!currentQuestion) return;

    const answer = currentQuestion.type === "multiple-choice" || currentQuestion.type === "true-false"
      ? selectedAnswer
      : shortAnswer

    // Case-insensitive comparison for true/false and multiple-choice
    // For short answer, we could implement partial matching or exact matching based on requirements
    const correct = answer.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()

    setIsCorrect(correct)
    setShowFeedback(true)

    setAnswers([
      ...answers,
      {
        questionId: currentQuestion.id,
        userAnswer: answer,
        correct,
      },
    ])

    setTimeout(() => {
      setShowFeedback(false)
      if (isLastQuestion) {
        setStage("results")
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        setSelectedAnswer("")
        setShortAnswer("")
      }
    }, 1500)
  }

  const restartQuiz = () => {
    setStage("setup")
    setCurrentQuestionIndex(0)
    setSelectedAnswer("")
    setShortAnswer("")
    setAnswers([])
    setError(null)
    setFile(null)

    // Reset file input if it exists
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const correctAnswers = answers.filter((a) => a.correct).length

  return (
    <div className="p-4">
      <AnimatePresence mode="wait">
        {stage === "setup" && (
          <motion.div
            key="setup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Tabs defaultValue="text" value={inputMethod} onValueChange={(v) => setInputMethod(v as "text" | "pdf")} className="mb-6">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="text">Enter Text</TabsTrigger>
                <TabsTrigger value="pdf">Upload PDF</TabsTrigger>
              </TabsList>

              <TabsContent value="text" className="pt-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic or Content</Label>
                  <Textarea
                    id="topic"
                    placeholder="Enter the quiz topic or paste content for quiz generation"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    rows={4}
                    className="min-h-[100px]"
                  />
                </div>
              </TabsContent>

              <TabsContent value="pdf" className="pt-4">
                <div className="rounded-lg border p-4 mb-4 bg-muted/30">
                  <h3 className="text-lg font-medium mb-2">Upload a PDF Document</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload a PDF document to generate quiz questions from its content.
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
                      className="flex-1"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Select PDF
                    </Button>
                  </div>

                  {file && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>

            <div className="space-y-2">
              <Label>Number of Questions: {numQuestions}</Label>
              <Slider
                value={[numQuestions]}
                min={1}
                max={10}
                step={1}
                onValueChange={(value) => setNumQuestions(value[0])}
              />
            </div>

            <div className="space-y-2">
              <Label>Difficulty Level</Label>
              <RadioGroup value={difficulty} onValueChange={setDifficulty} className="flex space-x-2">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="easy" id="easy" />
                  <Label htmlFor="easy">Easy</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="medium" />
                  <Label htmlFor="medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hard" id="hard" />
                  <Label htmlFor="hard">Hard</Label>
                </div>
              </RadioGroup>
            </div>

            {error && (
              <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-800 text-sm">
                {error}
              </div>
            )}

            <Button onClick={startQuiz} className="w-full">
              Generate & Start Quiz
            </Button>
          </motion.div>
        )}

        {stage === "loading" && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12"
          >
            <div className="w-12 h-12 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Generating quiz questions...</p>
            <Button
              variant="outline"
              size="sm"
              onClick={restartQuiz}
              className="mt-6"
            >
              Cancel
            </Button>
          </motion.div>
        )}

        {stage === "quiz" && currentQuestion && (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-1/2" />
            </div>

            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-xl font-medium mb-4">{currentQuestion.question}</h3>

              {currentQuestion.type === "multiple-choice" || currentQuestion.type === "true-false" ? (
                <div className="space-y-3">
                  {currentQuestion.options?.map((option) => (
                    <div
                      key={option}
                      onClick={() => !showFeedback && setSelectedAnswer(option)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedAnswer === option
                          ? showFeedback
                            ? option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
                              ? "bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-500"
                              : "bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-500"
                            : "bg-blue-100 border-blue-500 dark:bg-blue-900/30 dark:border-blue-500"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700"
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span>{option}</span>
                        {showFeedback &&
                          selectedAnswer === option &&
                          (option.toLowerCase() === currentQuestion.correctAnswer.toLowerCase() ? (
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Type your answer here"
                    value={shortAnswer}
                    onChange={(e) => setShortAnswer(e.target.value)}
                    disabled={showFeedback}
                    className={`${
                      showFeedback
                        ? isCorrect
                          ? "border-green-500 bg-green-50 dark:bg-green-900/30"
                          : "border-red-500 bg-red-50 dark:bg-red-900/30"
                        : ""
                    }`}
                  />
                  {showFeedback && (
                    <div
                      className={`text-sm ${isCorrect ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
                    >
                      {isCorrect ? (
                        <span className="flex items-center">
                          <Check className="h-4 w-4 mr-1" /> Correct!
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <X className="h-4 w-4 mr-1" /> Incorrect. The correct answer is:{" "}
                          {currentQuestion.correctAnswer}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              onClick={checkAnswer}
              disabled={
                showFeedback ||
                ((currentQuestion.type === "multiple-choice" || currentQuestion.type === "true-false") && !selectedAnswer) ||
                (currentQuestion.type === "short-answer" && !shortAnswer)
              }
              className="w-full"
            >
              {showFeedback ? (
                <span className="flex items-center">{isCorrect ? "Correct!" : "Incorrect"}</span>
              ) : (
                "Check Answer"
              )}
            </Button>
          </motion.div>
        )}

        {stage === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
              <h3 className="text-2xl font-bold mb-2">Quiz Results</h3>
              <div className="text-5xl font-bold mb-4 text-blue-600 dark:text-blue-400">
                {correctAnswers}/{questions.length}
              </div>
              <Progress value={(correctAnswers / questions.length) * 100} className="mb-4" />
              <p className="text-gray-600 dark:text-gray-300">
                {correctAnswers === questions.length
                  ? "Perfect score! Excellent work!"
                  : correctAnswers >= questions.length * 0.7
                    ? "Great job! You're doing well!"
                    : "Keep practicing to improve your score!"}
              </p>
            </div>

            <div className="space-y-4">
              <h4 className="text-lg font-medium">Review</h4>
              {questions.map((question, index) => {
                const answer = answers.find((a) => a.questionId === question.id)
                return (
                  <div
                    key={question.id}
                    className={`p-4 rounded-lg border ${
                      answer?.correct
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    }`}
                  >
                    <div className="flex justify-between">
                      <h5 className="font-medium">Question {index + 1}</h5>
                      {answer?.correct ? (
                        <span className="text-green-600 dark:text-green-400 flex items-center">
                          <Check className="h-4 w-4 mr-1" /> Correct
                        </span>
                      ) : (
                        <span className="text-red-600 dark:text-red-400 flex items-center">
                          <X className="h-4 w-4 mr-1" /> Incorrect
                        </span>
                      )}
                    </div>
                    <p className="mt-1">{question.question}</p>
                    <div className="mt-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Your answer:</span>
                        <span>{answer?.userAnswer}</span>
                      </div>
                      {!answer?.correct && (
                        <div className="flex justify-between mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Correct answer:</span>
                          <span className="text-green-600 dark:text-green-400">{question.correctAnswer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex space-x-3">
              <Button onClick={restartQuiz} variant="outline" className="flex-1">
                <RotateCcw className="h-4 w-4 mr-2" /> New Quiz
              </Button>
              <Button onClick={onClose} className="flex-1">
                <ArrowRight className="h-4 w-4 mr-2" /> Finish
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}