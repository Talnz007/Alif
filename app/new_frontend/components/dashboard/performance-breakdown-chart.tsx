"use client"

import { Bar } from "react-chartjs-2"
import { Chart, BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js"
import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"

Chart.register(BarController, CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface PerformanceBreakdownChartProps {
  userId: string
}

export default function PerformanceBreakdownChart({ userId }: PerformanceBreakdownChartProps) {
  const [labels, setLabels] = useState<string[]>([])
  const [progress, setProgress] = useState<number[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchSubjects() {
      setLoading(true)
      try {
        const resp = await fetch(`/api/users/${userId}/progress`)
        const data = await resp.json()
        if (data && data.topSubjects) {
          setLabels(data.topSubjects.map((s: any) => s.name))
          setProgress(data.topSubjects.map((s: any) => s.progress))
        }
      } catch { }
      setLoading(false)
    }
    if (userId) fetchSubjects()
  }, [userId])

  const chartData = {
    labels,
    datasets: [{
      label: "Progress (%)",
      data: progress,
      backgroundColor: "#FF4500",
      borderRadius: 8,
    }]
  }

  const chartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${ctx.parsed.y}% progress`
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Subjects", color: "#4B0082" },
        ticks: { color: "#4B0082" }
      },
      y: {
        title: { display: true, text: "Progress (%)", color: "#FF4500" },
        ticks: { color: "#FF4500", stepSize: 10 }
      }
    }
  }

  return (
    <Card className="rounded-2xl bg-white shadow p-4" aria-label="Performance by Subject">
      <h3 className="text-xl font-bold text-indigo-700 mb-2">Your Subjects</h3>
      {loading
        ? <div className="text-gray-400">Loading...</div>
        : <Bar data={chartData} options={chartOptions} height={180} aria-label="Bar chart for subject performance" />}
    </Card>
  )
}