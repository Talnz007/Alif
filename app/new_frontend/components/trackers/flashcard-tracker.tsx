"use client"

import { Card } from "@/components/ui/card"
import { Layers, ArrowRightCircle } from "lucide-react"
import { Line } from "react-chartjs-2"

interface FlashcardData {
  totalGenerated: number
  weeklyHistory: { week: string, count: number }[]
  preview?: { front: string, back: string }
}

export default function FlashcardTracker({ data }: { data: FlashcardData }) {
  const chartData = {
    labels: data.weeklyHistory.map(item => item.week),
    datasets: [
      {
        label: "Flashcards Created",
        data: data.weeklyHistory.map(item => item.count),
        backgroundColor: "#4B0082",
        borderColor: "#FF4500",
        fill: false,
      }
    ]
  }

  return (
    <Card className="p-4" aria-label="Flashcard Progress">
      <div className="flex items-center mb-2">
        <Layers className="text-indigo-600 mr-2" aria-hidden="true" />
        <h3 className="text-lg font-bold">Flashcards Generated: {data.totalGenerated}</h3>
      </div>
      {/* Line Chart */}
      <div className="my-4" aria-label="Flashcards per week">
        <Line data={chartData} height={100} />
      </div>
      {/* Quick Preview */}
      {data.preview && (
        <div className="mt-4 bg-gray-50 rounded-lg p-2 w-64" aria-label="Flashcard Preview">
          <strong>Preview:</strong>
          <div className="flex justify-between mt-2">
            <span className="font-medium">{data.preview.front}</span>
            <ArrowRightCircle className="mx-2 text-orange-500" aria-hidden="true" />
            <span>{data.preview.back}</span>
          </div>
        </div>
      )}
    </Card>
  )
}