"use client"

import { Card } from "@/components/ui/card"
import { FileText, Mic, Layers, Award } from "lucide-react"
import { Bar } from "react-chartjs-2"

interface UsageData {
  uploads: { type: "PDF" | "Audio", name: string, time: string }[]
  summarizations: number
  flashcards: number
  quizzes: number
}

export default function ContentUsageTracker({ data }: { data: UsageData }) {
  const chartData = {
    labels: ["PDF", "Audio"],
    datasets: [
      {
        label: "Uploads",
        data: [
          data.uploads.filter(u => u.type === "PDF").length,
          data.uploads.filter(u => u.type === "Audio").length,
        ],
        backgroundColor: ["#4B0082", "#FF4500"]
      }
    ]
  }

  return (
    <Card className="p-4" aria-label="Content Usage">
      <h3 className="text-lg font-bold mb-2">Content Usage Tracker</h3>
      {/* Upload History */}
      <div className="mb-2">
        <strong>Upload History:</strong>
        <ul className="list-disc ml-6">
          {data.uploads.slice(0, 5).map((u, i) => (
            <li key={i} className="text-sm">{u.name} ({u.type}) <span className="text-gray-400">{u.time}</span></li>
          ))}
        </ul>
      </div>
      <Bar data={chartData} height={80} />
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="flex items-center bg-indigo-50 px-2 py-1 rounded text-xs"><FileText className="mr-1" /> {data.summarizations} texts summarized</span>
        <span className="flex items-center bg-orange-50 px-2 py-1 rounded text-xs"><Layers className="mr-1" /> {data.flashcards} flashcards generated</span>
        <span className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs"><Award className="mr-1" /> {data.quizzes} quizzes generated</span>
      </div>
    </Card>
  )
}