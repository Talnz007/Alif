"use client"

import { useEffect, useState } from "react"
import QuizTracker from "@/components/trackers/quiz-tracker"

function processQuizStats(logs: any[]) {
  // Example: Average, weekly accuracy, quizzes, best/hardest quiz
  const quizzes = logs.map((log: any) => ({
    id: log.id,
    title: log.metadata?.title || `Quiz ${log.id}`,
    correct: log.metadata?.correct_answers || 0,
    total: log.metadata?.total_questions || 0,
    difficulty: log.metadata?.difficulty || "Medium",
    score: log.metadata?.score ?? 0,
  }))
  const averageScore = quizzes.length
    ? Math.round(quizzes.reduce((acc, q) => acc + q.score, 0) / quizzes.length)
    : 0
  // Weekly accuracy (dummy: by week, can expand)
  const weeklyAccuracy = quizzes.slice(-5).map(q => q.total ? Math.round((q.correct / q.total) * 100) : 0)
  const bestQuiz = quizzes.length
  ? quizzes.reduce((max, q) => q.score > max.score ? q : max, quizzes[0]).title
  : undefined;
  const hardestQuiz = quizzes.length
  ? quizzes.reduce((min, q) => q.score < min.score ? q : min, quizzes[0]).title
  : undefined;
  return { averageScore, weeklyAccuracy, quizzes, bestQuiz, hardestQuiz }
}

export default function QuizTrackerFetcher({ userId }: { userId: string }) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/activities/log?type=quiz_completed&userId=${userId}`)
      .then(res => res.json())
      .then(logs => setStats(processQuizStats(logs)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="p-4">Loading quiz stats...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  return stats ? <QuizTracker stats={stats} /> : null
}