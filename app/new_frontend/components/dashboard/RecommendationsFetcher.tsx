"use client"

import { useEffect, useState } from "react"
import Recommendations from "@/components/dashboard/recommendations"

interface Props {
  userId: string
}

export default function RecommendationsFetcher({ userId }: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const cacheKey = `recommendations_${userId}`
    const cached = localStorage.getItem(cacheKey)
    const cacheTime = localStorage.getItem(`${cacheKey}_timestamp`)
    const now = Date.now()
    const twelveHours = 12 * 60 * 60 * 1000

    if (cached && cacheTime && (now - parseInt(cacheTime) < twelveHours)) {
      setSuggestions(JSON.parse(cached))
      return
    }

    setLoading(true)
    setError(null)

    fetch("http://localhost:8000/api/v1/personal_recommendations/personal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, days: 14 })
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch recommendations")
        return res.json()
      })
      .then(data => {
        const newSuggestions = data.suggestions || []
        setSuggestions(newSuggestions)
        localStorage.setItem(cacheKey, JSON.stringify(newSuggestions))
        localStorage.setItem(`${cacheKey}_timestamp`, now.toString())
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [userId])

  if (loading) return <div className="p-4">Loading recommendations...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  return <Recommendations suggestions={suggestions} />
}