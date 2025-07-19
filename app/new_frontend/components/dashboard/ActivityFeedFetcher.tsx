"use client"

import { useEffect, useState } from "react"
import ActivityFeed from "@/components/dashboard/activity-feed"
import { logUserActivity } from "@/lib/user-activity"

export default function ActivityFeedFetcher({ userId }: { userId: string }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    async function fetchActivities() {
      const response = await logUserActivity("activity_feed_request", { userId })
      if (response.success && response.newBadges) {
        const items = response.newBadges.map((log: any) => ({
          type: log.activity_type.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: log.metadata?.description || log.activity_type,
          time: new Date(log.timestamp).toLocaleString(),
        }))
        setItems(items)
      } else {
        setError("Failed to fetch activities")
      }
      setLoading(false)
    }
    fetchActivities()
  }, [userId])

  if (loading) return <div className="p-4">Loading activity...</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  return <ActivityFeed items={items} />
}