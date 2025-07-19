"use client"

import { Card } from "@/components/ui/card"
import { Activity } from "lucide-react"

interface ActivityItem {
  type: string
  description: string
  time: string
}

export default function ActivityFeed({ items, loading, error }: { items: ActivityItem[], loading?: boolean, error?: string }) {
  if (loading) return <div className="p-4 text-gray-500 dark:text-gray-400">Loading activity...</div>
  if (error) return <div className="p-4 text-red-500 dark:text-red-400">{error}</div>
  if (!items?.length) return <div className="p-4 text-gray-500 dark:text-gray-400">No recent activity.</div>

  return (
    <Card className="p-4" aria-label="Recent Activity Feed">
      <div className="flex items-center mb-2">
        <Activity className="text-indigo-600 dark:text-indigo-300 mr-2" aria-hidden="true" />
        <h3 className="text-lg font-bold">Recent Activity</h3>
      </div>
      <ul className="mt-2 space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start">
            <span className="font-bold text-indigo-500 dark:text-indigo-300 mr-2">{item.type}</span>
            <span className="text-sm">{item.description}</span>
            <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{item.time}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}