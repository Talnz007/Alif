"use client"

import { useEffect, useState } from "react"
import MathTracker from "@/components/trackers/math-tracker"
import { useAuth } from "@/contexts/auth-context";

function processMathStats(logs: any[]) {
  const streak = logs.length
  const totalSolved = logs.length
  const lastSolved = logs.length ? new Date(logs[logs.length - 1].timestamp).toLocaleDateString() : "N/A"
  const xp = totalSolved * 10
  return { streak, lastSolved, xp, totalSolved }
}

export default function MathTrackerFetcher({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth(); // Get token

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/activities/log?type=math_problem_solved&userId=${userId}`, {
      headers: { ...(token && { Authorization: `Bearer ${token}` }) },
    })
      .then(res => res.json())
      .then(logs => setData(processMathStats(logs)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId, token])

  if (loading) return <div className="p-4">Loading math stats...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  return data ? <MathTracker data={data} /> : null
}