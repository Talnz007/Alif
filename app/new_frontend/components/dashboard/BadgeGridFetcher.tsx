"use client"

import { useEffect, useState } from "react"
import BadgeGrid from "@/components/dashboard/badge-grid"

export default function BadgeGridFetcher({ userId }: { userId: string }) {
  const [badges, setBadges] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    fetch(`/api/badges?userId=${userId}&showAll=true`)
      .then(res => res.json())
      .then(data => setBadges(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="p-4">Loading badges...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  return <BadgeGrid badges={badges} />
}