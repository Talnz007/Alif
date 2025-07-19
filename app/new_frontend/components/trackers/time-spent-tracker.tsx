"use client"

import { Card } from "@/components/ui/card"
import { Clock, TrendingUp } from "lucide-react"
import { Line } from "react-chartjs-2"

interface TimeSpentData {
  hoursThisWeek: number
  goalHours: number
  dailyHistory: { day: string, hours: number }[]
  comparison: string
}

export default function TimeSpentTracker({ data }: { data: TimeSpentData }) {
  const chartData = {
    labels: data.dailyHistory.map(d => d.day),
    datasets: [
      {
        label: "Hours Studied",
        data: data.dailyHistory.map(d => d.hours),
        backgroundColor: "#4B0082",
        borderColor: "#FF4500",
        fill: false,
      }
    ]
  }

  return (
    <Card className="p-4" aria-label="Time Spent Studying">
      <div className="flex items-center mb-2">
        <Clock className="text-indigo-600 mr-2" aria-hidden="true" />
        <h3 className="text-lg font-bold">Time Spent Learning</h3>
        <div className="ml-auto text-xl font-bold">{data.hoursThisWeek} hrs this week</div>
      </div>
      <div className="mt-2">
        <span className="text-sm">Weekly Goal: {data.hoursThisWeek}/{data.goalHours} hrs done</span>
        <div className="text-xs text-orange-500 mt-1">Motivation: Just {Math.max(0, data.goalHours - data.hoursThisWeek)} more mins to level up!</div>
        <div className="text-xs text-gray-500 mt-1">{data.comparison}</div>
      </div>
      <Line data={chartData} height={80} />
    </Card>
  )
}