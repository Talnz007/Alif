"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { CheckCircle, XCircle, ArrowRight, BookOpen, Brain, BarChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

// Demo quiz questions
const quizQuestions = [
  {
    question: "What is the primary benefit of interactive learning?",
    options: [
      "It's more entertaining",
      "It improves knowledge retention",
      "It requires less time",
      "It's less expensive",
    ],
    correctAnswer: 1,
  },
  {
    question: "Which of these is a feature of adaptive learning?",
    options: [
      "One-size-fits-all curriculum",
      "Static content delivery",
      "Personalized learning paths",
      "Manual progress tracking",
    ],
    correctAnswer: 2,
  },
  {
    question: "How does spaced repetition help with learning?",
    options: [
      "It makes learning faster",
      "It enhances long-term memory retention",
      "It reduces the need for practice",
      "It eliminates the need for assessments",
    ],
    correctAnswer: 1,
  },
]

const sampleFlashcards = [
  {
    id: 1,
    front: "What is the mitochondria?",
    back: "Powerhouse of the cell",
    subject: "Biology",
  },
  {
    id: 2,
    front: "What's the derivative of sin(x)?",
    back: "cos(x)",
    subject: "Calculus",
  },
  {
    id: 3,
    front: "What does DNA stand for?",
    back: "Deoxyribonucleic Acid",
    subject: "Biology",
  },
]

export function InteractiveDemo() {
  const [activeTab, setActiveTab] = useState("summarizer")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [correctAnswers, setCorrectAnswers] = useState(0)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [currentCard, setCurrentCard] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const handleAnswerSelect = (index: number) => {
    if (showFeedback) return
    setSelectedAnswer(index)
  }

  const checkAnswer = () => {
    if (selectedAnswer === null) return

    setShowFeedback(true)

    if (selectedAnswer === quizQuestions[currentQuestion].correctAnswer) {
      setCorrectAnswers((prev) => prev + 1)
    }

    setTimeout(() => {
      setShowFeedback(false)

      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion((prev) => prev + 1)
        setSelectedAnswer(null)
      } else {
        setQuizCompleted(true)
      }
    }, 1500)
  }

  const resetQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setShowFeedback(false)
    setCorrectAnswers(0)
    setQuizCompleted(false)
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const nextCard = () => {
    setIsFlipped(false)
    setCurrentCard((prev) => (prev + 1) % sampleFlashcards.length)
  }

  return (
    <div className="max-w-6xl mx-auto">
      <Tabs defaultValue="summarizer" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-8 bg-muted/50">
          <TabsTrigger value="summarizer" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            <span>Smart Summarizer</span>
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-2">
            <BarChart className="h-4 w-4" />
            <span>Interactive Quiz</span>
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            <span>Smart Flashcards</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summarizer" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
                      <Brain className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">🧠 Smart Summarizer</h3>
                      <p className="text-sm text-muted-foreground">
                        Drop your notes or PDFs — we'll extract the key points in seconds. No fluff, just what you need
                        to know.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 text-xs flex items-center justify-center mr-2">
                        1
                      </span>
                      Before: Cluttered PDF
                    </h4>
                    <div className="bg-muted rounded-lg p-4 h-64 overflow-y-auto text-sm border">
                      <p className="mb-4">
                        <strong>Chapter 5: Photosynthesis and Cellular Respiration</strong>
                      </p>
                      <p className="mb-2">
                        Photosynthesis is a complex biological process that occurs in plants, algae, and certain
                        bacteria. This process involves the conversion of light energy, usually from the sun, into
                        chemical energy stored in glucose molecules. The process can be divided into two main stages:
                        the light-dependent reactions and the light-independent reactions (Calvin cycle).
                      </p>
                      <p className="mb-2">
                        The light-dependent reactions occur in the thylakoid membranes of chloroplasts. During this
                        stage, chlorophyll and other pigments absorb light energy, which is used to split water
                        molecules (H2O) into hydrogen and oxygen. The oxygen is released as a byproduct, while the
                        hydrogen is used to produce ATP and NADPH, which are energy-carrying molecules.
                      </p>
                      <p>
                        The Calvin cycle takes place in the stroma of chloroplasts. In this stage, carbon dioxide from
                        the atmosphere is fixed into organic molecules using the ATP and NADPH produced in the
                        light-dependent reactions. The end result is the production of glucose...
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 text-xs flex items-center justify-center mr-2">
                        2
                      </span>
                      After: Clean Summary
                    </h4>
                    <div className="bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/30 dark:to-teal-950/30 rounded-lg p-4 h-64 overflow-y-auto text-sm border border-green-200 dark:border-green-800">
                      <div className="space-y-3">
                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-green-600 mt-2 mr-3 flex-shrink-0"></div>
                          <p>
                            <strong>Photosynthesis:</strong> Plants convert sunlight → glucose (chemical energy)
                          </p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-green-600 mt-2 mr-3 flex-shrink-0"></div>
                          <p>
                            <strong>Two Stages:</strong> Light-dependent reactions + Calvin cycle
                          </p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-green-600 mt-2 mr-3 flex-shrink-0"></div>
                          <p>
                            <strong>Light-Dependent:</strong> Occurs in thylakoids → splits H2O → produces ATP & NADPH +
                            O2
                          </p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-green-600 mt-2 mr-3 flex-shrink-0"></div>
                          <p>
                            <strong>Calvin Cycle:</strong> Occurs in stroma → uses CO2 + ATP + NADPH → makes glucose
                          </p>
                        </div>
                        <div className="flex items-start">
                          <div className="w-2 h-2 rounded-full bg-green-600 mt-2 mr-3 flex-shrink-0"></div>
                          <p>
                            <strong>Result:</strong> Glucose production for plant energy + O2 for atmosphere
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <Button
                    asChild
                    className="bg-gradient-to-r from-indigo-600 to-orange-500 hover:from-indigo-700 hover:to-orange-600"
                  >
                    <Link href="/register" target="_blank">
                      Try Smart Summarizer <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quiz" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 p-6 border-b">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-orange-100 dark:bg-orange-900/50 flex items-center justify-center">
                    <BarChart className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">❓ Interactive Quiz Practice</h3>
                    <p className="text-sm text-muted-foreground">
                      Turn your notes into quick practice sessions with MCQs, true/false, and short answers. Instant
                      feedback included.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {!quizCompleted ? (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">
                        Question {currentQuestion + 1} of {quizQuestions.length}
                      </span>
                      <Progress value={((currentQuestion + 1) / quizQuestions.length) * 100} className="w-1/2" />
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 rounded-xl p-6 border border-purple-100 dark:border-purple-800">
                      <h4 className="text-lg font-medium mb-4">{quizQuestions[currentQuestion].question}</h4>

                      <div className="space-y-3">
                        {quizQuestions[currentQuestion].options.map((option, index) => (
                          <motion.div
                            key={index}
                            className={`p-3 rounded-lg border cursor-pointer transition-all ${
                              selectedAnswer === index
                                ? showFeedback
                                  ? index === quizQuestions[currentQuestion].correctAnswer
                                    ? "bg-green-100 border-green-500 dark:bg-green-900/30 dark:border-green-500"
                                    : "bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-500"
                                  : "bg-indigo-100 border-indigo-500 dark:bg-indigo-900/30 dark:border-indigo-500"
                                : "hover:bg-muted border-gray-200 dark:border-gray-700"
                            }`}
                            onClick={() => handleAnswerSelect(index)}
                            whileHover={{ scale: selectedAnswer === null ? 1.02 : 1 }}
                            animate={
                              showFeedback && selectedAnswer === index
                                ? index === quizQuestions[currentQuestion].correctAnswer
                                  ? { scale: [1, 1.05, 1] }
                                  : { x: [0, -5, 5, -5, 0] }
                                : {}
                            }
                            transition={{ duration: 0.5 }}
                          >
                            <div className="flex justify-between items-center">
                              <span>{option}</span>
                              {showFeedback &&
                                selectedAnswer === index &&
                                (index === quizQuestions[currentQuestion].correctAnswer ? (
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                                ) : (
                                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    <Button onClick={checkAnswer} disabled={selectedAnswer === null || showFeedback} className="w-full">
                      {showFeedback ? (
                        selectedAnswer === quizQuestions[currentQuestion].correctAnswer ? (
                          <span className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4" /> Correct!
                          </span>
                        ) : (
                          <span className="flex items-center">
                            <XCircle className="mr-2 h-4 w-4" /> Incorrect
                          </span>
                        )
                      ) : (
                        "Check Answer"
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
                    <p className="text-muted-foreground mb-6">
                      You got {correctAnswers} out of {quizQuestions.length} questions correct.
                    </p>
                    <Progress value={(correctAnswers / quizQuestions.length) * 100} className="mb-8 max-w-md mx-auto" />
                    <div className="flex justify-center space-x-4">
                      <Button variant="outline" onClick={resetQuiz}>
                        Try Again
                      </Button>
                      <Button
                        asChild
                        className="bg-gradient-to-r from-indigo-600 to-orange-500 hover:from-indigo-700 hover:to-orange-600"
                      >
                        <Link href="/register" target="_blank">
                          Create Your Own Quizzes
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="flashcards" className="focus-visible:outline-none focus-visible:ring-0">
          <Card className="border shadow-sm rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 p-6 border-b">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-10 w-10 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">🃏 Smart Flashcards</h3>
                    <p className="text-sm text-muted-foreground">
                      Instantly generate and practice flashcards pulled from your materials. Tap to flip. Built for
                      long-term recall.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6">
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

                <div className="text-center">
                  <div className="flex justify-center space-x-4 mb-6">
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

                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={nextCard}>
                      Next Card
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
