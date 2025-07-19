"use client"

import { Card } from "@/components/ui/card"
import { HelpCircle, Star } from "lucide-react"

interface QuestionActivityData {
  totalQuestions: number
  curiosityScore: number
  sampleQuestions: string[]
  wordCloudTopics: string[]
  badgeUnlocked: boolean
}

export default function QuestionActivityTracker({ data }: { data: QuestionActivityData }) {
  return (
    <Card className="p-4" aria-label="Question Activity">
      <div className="flex items-center mb-2">
        <HelpCircle className="text-orange-500 mr-2" aria-hidden="true" />
        <h3 className="text-lg font-bold">Questions Asked: {data.totalQuestions}</h3>
          {data.badgeUnlocked &&
              <span className="flex items-center ml-2">
                <Star className="text-yellow-400" aria-label="Curious Cat Badge unlocked"/>
                <span className="sr-only">Curious Cat Badge unlocked</span>
            </span>
          }
      </div>
      <div className="mt-2">
        <span className="text-sm">Curiosity Level: {data.curiosityScore}/100</span>
      </div>
      <div className="mt-2">
        <strong>Recent Questions:</strong>
        <ul className="list-disc ml-6">
          {data.sampleQuestions.slice(0, 3).map((q, i) => (
            <li key={i} className="text-xs">{q}</li>
          ))}
        </ul>
      </div>
      <div className="mt-2">
        <strong>Popular Topics:</strong>
        <div className="flex flex-wrap gap-1">
          {data.wordCloudTopics.map((topic, i) => (
            <span key={i} className="px-2 py-1 rounded bg-indigo-50 text-indigo-700 text-xs">{topic}</span>
          ))}
        </div>
      </div>
    </Card>
  )
}