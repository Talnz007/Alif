"use client"

import { Lightbulb } from "lucide-react"

export default function Recommendations({ suggestions, loading, error }: { suggestions: string[], loading?: boolean, error?: string }) {
  if (loading) return <div className="p-4 text-gray-500 dark:text-gray-400">Loading recommendations...</div>
  if (error) return <div className="p-4 text-red-500 dark:text-red-400">{error}</div>
  if (!suggestions?.length) return <div className="p-4 text-gray-500 dark:text-gray-400">No recommendations available.</div>

  return (
    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-300 dark:border-orange-700 mb-4" aria-label="Personalized Recommendations">
      <div className="flex items-center mb-2">
        <Lightbulb className="text-orange-500 dark:text-orange-300 mr-2" aria-hidden="true" />
        <h3 className="text-lg font-bold text-orange-700 dark:text-orange-300">Recommended for You</h3>
      </div>
      <ul className="list-disc pl-6">
        {suggestions.map((s, i) => (
          <li key={i} className="text-orange-700 dark:text-orange-300 text-sm mb-1">{s}</li>
        ))}
      </ul>
    </div>
  )
}