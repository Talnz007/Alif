"use client"

import { Doughnut } from "react-chartjs-2"
import { Chart, ArcElement, Tooltip, Legend } from "chart.js"
import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context";

Chart.register(ArcElement, Tooltip, Legend)

interface QuizPerformanceDonutProps {
  userId: string
}

export default function QuizPerformanceDonut({ userId }: QuizPerformanceDonutProps) {
  const [labels, setLabels] = useState<string[]>([])
  const [scores, setScores] = useState<number[]>([])
  const [loading, setLoading] = useState(true)
  const { token } = useAuth(); // Get token

  useEffect(() => {
    async function fetchQuizStats() {
      setLoading(true)
      try {
        const resp = await fetch(
          `/api/activities/log?type=quiz_completed&userId=${userId}`,
          {
            method: 'GET',
            headers: {
              ...(token && { Authorization: `Bearer ${token}` }),
            }
          }
        )
        const logs = await resp.json()
        const sources: { [source: string]: number[] } = {}
        logs.forEach((q: any) => {
          const src = q.metadata?.source || "Other"
          const score = q.metadata?.score ?? 0
          sources[src] = sources[src] || []
          sources[src].push(score)
        })
        setLabels(Object.keys(sources))
        setScores(Object.values(sources).map(arr => Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)))
      } catch (error) {
        console.error('Error fetching quiz stats:', error)
      }
      setLoading(false)
    }
    if (userId) fetchQuizStats()
  }, [userId, token])

  const chartData = {
    labels,
    datasets: [{
      data: scores,
      backgroundColor: ["#FF4500", "#4B0082", "#FFD700", "#20B2AA", "#8884FF", "#FF69B4"],
      borderWidth: 2,
    }]
  }

  const chartOptions = {
    plugins: {
      legend: { position: "right" as const, labels: { color: "#4B0082", font: { size: 14 } } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed} avg score`
        }
      }
    }
  }

  return (
    <Card className="rounded-2xl bg-white shadow p-4" aria-label="Quiz Performance Breakdown">
      <h3 className="text-xl font-bold text-indigo-700 mb-2">Quiz Performance by Source</h3>
      {loading
        ? <div className="text-gray-400">Loading...</div>
        : <Doughnut data={chartData} options={chartOptions} height={180} aria-label="Donut chart of quiz performance by source" />}
    </Card>
  )
}