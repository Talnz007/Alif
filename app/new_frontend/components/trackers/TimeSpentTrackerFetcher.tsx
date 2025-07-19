"use client"

import { useEffect, useState } from "react"
import TimeSpentTracker from "@/components/trackers/time-spent-tracker"

function processTimeSpentStats(logs: any[]) {
  // Example: calculate hours, goal, history, comparison
  const goalHours = 6
  const byDay: Record<string, number> = {}
  logs.forEach(log => {
    const day = new Date(log.timestamp).toLocaleDateString()
    const minutes = log.metadata?.duration ? Number(log.metadata.duration) : 0
    byDay[day] = (byDay[day] || 0) + minutes
  })
  const dailyHistory = Object.entries(byDay).map(([day, mins]) => ({
    day,
    hours: +(mins / 60).toFixed(1)
  }))
  const hoursThisWeek = dailyHistory.reduce((sum, d) => sum + d.hours, 0)
  const comparison = hoursThisWeek >= goalHours
    ? "You reached your weekly goal! 🎉"
    : "Keep going! You're almost there."
  return { hoursThisWeek, goalHours, dailyHistory, comparison }
}

export default function TimeSpentTrackerFetcher({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/activities/log?type=study_session_end&userId=${userId}`)
      .then(res => res.json())
      .then(logs => setData(processTimeSpentStats(logs)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="p-4">Loading study time...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  return data ? <TimeSpentTracker data={data} /> : null
}