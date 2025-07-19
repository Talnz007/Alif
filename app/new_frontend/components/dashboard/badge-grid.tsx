"use client"

import { Card } from "@/components/ui/card"
import { Award } from "lucide-react"

interface Badge {
  id: number
  name: string
  description: string
  image_url: string
  is_earned: boolean
}

export default function BadgeGrid({ badges, loading, error }: { badges: Badge[], loading?: boolean, error?: string }) {
  if (loading) return <div className="p-4 text-gray-500 dark:text-gray-400">Loading badges...</div>
  if (error) return <div className="p-4 text-red-500 dark:text-red-400">{error}</div>
  if (!badges?.length) return <div className="p-4 text-gray-500 dark:text-gray-400">No badges available.</div>

  return (
    <Card className="p-4" aria-label="Badge Collection">
      <h3 className="text-lg font-bold mb-2">Your Badges</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {badges.map(badge => (
          <div key={badge.id} className={`flex flex-col items-center p-2 rounded-lg ${badge.is_earned ? "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-700" : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700"}`} aria-label={badge.is_earned ? `Earned badge ${badge.name}` : `Badge ${badge.name}`}>
            <img
              src={badge.image_url || '/badges/default.png'}
              alt={badge.name}
              className="w-12 h-12 mb-1"
              onError={(e) => { e.currentTarget.src = '/badges/default.png'; }}
              aria-hidden="true"
              style={{ filter: badge.is_earned ? "none" : "grayscale(100%)" }}
            />
            <span className={`font-semibold ${badge.is_earned ? "text-orange-600 dark:text-orange-300" : "text-gray-500 dark:text-gray-400"}`}>{badge.name}</span>
            <span className="text-xs text-gray-400 dark:text-gray-500">{badge.description}</span>
            {badge.is_earned && <Award className="text-orange-500 dark:text-orange-300 mt-1" aria-label="Earned" />}
          </div>
        ))}
      </div>
    </Card>
  )
}