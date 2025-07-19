"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { File, Calendar, TrendingUp } from "lucide-react"
import { useEffect, useState } from "react"

interface QuizMetadata {
  total_questions?: number
  correct_answers?: number
  answers?: Array<{
    question?: string
    userAnswer?: string
    correctAnswer?: string
    correct?: boolean
  }>
}

interface RecentQuiz {
  id: string
  title: string
  score: number
  date: string
  metadata?: QuizMetadata | string
}

interface AssignmentData {
  totalCompleted: number
  averageScore: number
  currentStreak: number
  recentQuizzes: RecentQuiz[]
}

export default function QuizStats({ userId }: { userId: string }) {
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      setLoading(true)
      try {
        const response = await fetch(`/api/assignments/stats`, {
          headers: { 'x-user-id': userId }
        });
        if (!response.ok) throw new Error("Failed to fetch quiz stats");
        const data = await response.json();
        console.log("Fetched quiz data:", data);
        const updatedData = {
          ...data,
          recentQuizzes: data.recentQuizzes.map((quiz: RecentQuiz) => ({
            ...quiz,
            metadata: typeof quiz.metadata === 'string' ? JSON.parse(quiz.metadata) : quiz.metadata
          }))
        };
        setAssignmentData(updatedData);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchStats()
  }, [userId])

  if (loading) return <div className="p-6">Loading...</div>
  if (error) return <div className="p-6 text-red-600 dark:text-red-400">{error}</div>
  if (!assignmentData) return <div className="p-6">No quiz data available</div>

  const recentQuizzes = assignmentData.recentQuizzes || [];

  return (
    <Card className="dark:bg-gray-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-md font-medium text-gray-900 dark:text-gray-100">Quiz Statistics</CardTitle>
        <File className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Quizzes</h4>
            {recentQuizzes.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">No recent quizzes found.</p>
            ) : (
              <div className="space-y-3">
                {recentQuizzes.map((quiz: RecentQuiz, index) => {
                  const metadata = typeof quiz.metadata === 'object' ? quiz.metadata : {};
                  const totalQuestions = metadata.total_questions || 1;
                  const correctAnswers = metadata.correct_answers || 0;
                  const displayTitle = `Quiz - ${new Date(quiz.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
                  return (
                    <motion.div
                      key={quiz.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg"
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h5 className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {displayTitle}
                          </h5>
                          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(quiz.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <Badge className={`${
                            correctAnswers >= totalQuestions * 0.9 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                            correctAnswers >= totalQuestions * 0.7 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                            'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                          }`}>
                            {correctAnswers}/{totalQuestions}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-2">
                        <Progress value={(correctAnswers / totalQuestions) * 100} className="h-1" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-2 text-center">
            <a href="/study-assistant" className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
              Take a Quiz
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}