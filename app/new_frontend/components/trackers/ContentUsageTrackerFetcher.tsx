"use client"

import { useEffect, useState } from "react"
import ContentUsageTracker from "@/components/trackers/content-usage-tracker"
import { useAuth } from "@/contexts/auth-context";

export default function ContentUsageTrackerFetcher({ userId }: { userId: string }) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { token } = useAuth(); // Get token

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    setError(null)
    Promise.all([
      fetch(`/api/activities/log?type=document_uploaded&userId=${userId}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      }).then(r => r.json()),
      fetch(`/api/activities/log?type=audio_uploaded&userId=${userId}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      }).then(r => r.json()),
      fetch(`/api/activities/log?type=text_summarized&userId=${userId}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      }).then(r => r.json()),
      fetch(`/api/activities/log?type=flashcards_generated&userId=${userId}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      }).then(r => r.json()),
      fetch(`/api/activities/log?type=quiz_generated&userId=${userId}`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      }).then(r => r.json()),
    ]).then(([doc, audio, text, flash, quiz]) => {
      setData({
        uploads: [
          ...doc.map((log: any) => ({ type: "PDF", name: log.metadata?.filename || "PDF", time: log.timestamp })),
          ...audio.map((log: any) => ({ type: "Audio", name: log.metadata?.filename || "Audio", time: log.timestamp })),
        ],
        summarizations: text.length,
        flashcards: flash.length,
        quizzes: quiz.length,
      })
    }).catch(err => setError(err.message))
    .finally(() => setLoading(false))
  }, [userId, token])

  if (loading) return <div className="p-4">Loading usage...</div>
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>
  return data ? <ContentUsageTracker data={data} /> : null
}