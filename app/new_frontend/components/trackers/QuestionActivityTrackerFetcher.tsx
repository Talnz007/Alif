"use client"

import { useEffect, useState } from "react"
import QuestionActivityTracker from "@/components/trackers/question-activity-tracker"

function processQuestionActivity(logs: any[]) {
  const totalQuestions = logs.length
  const sampleQuestions = logs.slice(-3).map(log => log.metadata?.question || "N/A")
  // Example: curiosity score = number of questions * 2, capped at 100
  const curiosityScore = Math.min(totalQuestions * 2, 100)
  // Example: word cloud topics (from metadata)
  const topics: Record<string, number> = {}
  logs.forEach(log => {
    const topic = log.metadata?.topic || "General"
    topics[topic] = (topics[topic] || 0) + 1
  })
  const wordCloudTopics = Object.keys(topics)
  // Example: badge unlocked if > 10 questions
  const badgeUnlocked = totalQuestions >= 10
  return { totalQuestions, curiosityScore, sampleQuestions, wordCloudTopics, badgeUnlocked }
}

export default function QuestionActivityTrackerFetcher({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/activities/log?type=question_asked&userId=${userId}`)
      .then(res => res.json())
      .then(logs => setData(processQuestionActivity(logs)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="p-4">Loading question activity...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  return data ? <QuestionActivityTracker data={data} /> : null
}