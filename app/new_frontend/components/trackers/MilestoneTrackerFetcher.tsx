"use client"

import { useEffect, useState } from "react"
import MilestoneTracker from "@/components/trackers/milestone-tracker"

function processMilestoneStats(logs: any[]) {
  // Example: joinedDate = first registration, achievements = log list, explorerBadge = true if > 5 activities
  const joinedDate = logs.length ? new Date(logs[0].timestamp).toLocaleDateString() : "N/A"
  const achievements = logs.map(log => ({
    title: log.activity_type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
    date: new Date(log.timestamp).toLocaleDateString()
  }))
  const explorerBadge = logs.length > 5
  return { joinedDate, achievements, explorerBadge }
}

export default function MilestoneTrackerFetcher({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/activities/log?type=user_registration&userId=${userId}`)
      .then(res => res.json())
      .then(logs => setData(processMilestoneStats(logs)))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="p-4">Loading milestones...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  return data ? <MilestoneTracker data={data} /> : null
}