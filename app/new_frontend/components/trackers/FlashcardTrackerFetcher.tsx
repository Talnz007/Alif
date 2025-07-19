"use client"

import { useEffect, useState } from "react"
import FlashcardTracker from "@/components/trackers/flashcard-tracker"
import { useAuth } from "@/contexts/auth-context";

function processFlashcardStats(logs: any[]) {
  const totalGenerated = logs.length
  const preview = logs.length ? logs[logs.length - 1].metadata?.sample_flashcard : undefined
  const weekMap = new Map<string, number>()
  logs.forEach(log => {
    const week = new Date(log.timestamp)
    const weekStr = `${week.getFullYear()}-W${Math.ceil((week.getDate() + ((week.getDay() + 6) % 7)) / 7)}`
    weekMap.set(weekStr, (weekMap.get(weekStr) || 0) + 1)
  })
  const weeklyHistory = Array.from(weekMap.entries()).map(([week, count]) => ({ week, count }))
  return { totalGenerated, weeklyHistory, preview }
}

export default function FlashcardTrackerFetcher({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth(); // Get token

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/activities/log?type=flashcards_generated&userId=${userId}`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    })
      .then(res => res.json())
      .then(logs => setData(processFlashcardStats(logs)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId, token])

  if (loading) return <div className="p-4">Loading flashcard stats...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  return data ? <FlashcardTracker data={data} /> : null
}