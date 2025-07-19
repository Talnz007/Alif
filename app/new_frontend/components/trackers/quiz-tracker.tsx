"use client"

import { Card } from "@/components/ui/card"
import { Bar } from "react-chartjs-2"
import { Star, Award, TrendingUp } from "lucide-react"

interface QuizStats {
  averageScore: number
  weeklyAccuracy: number[]
  quizzes: {
    id: string
    title: string
    correct: number
    total: number
    difficulty: "Easy" | "Medium" | "Hard"
    score: number
  }[]
  bestQuiz?: string
  hardestQuiz?: string
}

export default function QuizTracker({ stats }: { stats: QuizStats }) {
  const chartData = {
    labels: stats.weeklyAccuracy.map((_, i) => `Week ${i + 1}`),
    datasets: [
      {
        label: "Weekly Accuracy (%)",
        data: stats.weeklyAccuracy,
        backgroundColor: "#FF4500"
      }
    ]
  }

  return (
    <Card className="p-4" aria-label="Quiz Performance">
      <div className="flex items-center mb-2">
        <Award className="text-orange-500 mr-2" aria-hidden="true" />
        <h3 className="text-lg font-bold">Quiz Performance</h3>
        <span className="ml-auto text-2xl font-bold text-orange-700">{stats.averageScore}%</span>
      </div>
      {/* Weekly Accuracy Bar Chart */}
      <Bar data={chartData} height={100} />
      {/* Best/Hardest Quiz */}
      <div className="mt-2 flex flex-wrap gap-2">
        <div className="flex items-center text-sm bg-green-100 px-2 py-1 rounded">
          <Star className="mr-1 text-green-600" aria-hidden="true" />
          Best Quiz: {stats.bestQuiz || "N/A"}
        </div>
        <div className="flex items-center text-sm bg-red-100 px-2 py-1 rounded">
          <TrendingUp className="mr-1 text-red-600" aria-hidden="true" />
          Most Challenging: {stats.hardestQuiz || "N/A"}
        </div>
      </div>
      {/* Difficulty Badges */}
      <div className="mt-2 flex gap-2 flex-wrap">
        {stats.quizzes.map(q => (
          <span key={q.id} className={`px-2 py-1 rounded text-xs ${q.difficulty === "Easy" ? "bg-green-50 text-green-700" : q.difficulty === "Medium" ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"}`}>
            {q.difficulty}
          </span>
        ))}
      </div>
    </Card>
  )
}