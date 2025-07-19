"use client"

import { Card } from "@/components/ui/card"
import { Calendar, Award } from "lucide-react"

interface MilestoneData {
  joinedDate: string
  achievements: { title: string, date: string }[]
  explorerBadge: boolean
}

export default function MilestoneTracker({ data }: { data: MilestoneData }) {
  return (
    <Card className="p-4" aria-label="Account Milestones">
      <div className="flex items-center mb-2">
        <Calendar className="text-indigo-600 mr-2" aria-hidden="true" />
        <h3 className="text-lg font-bold">Milestones</h3>
        {data.explorerBadge && <Award className="ml-2 text-orange-500" aria-label="Alif Explorer Badge" />}
      </div>
      <div className="mt-2 text-sm">
        <span>Joined Alif on {data.joinedDate}</span>
      </div>
      <ul className="list-disc ml-6 mt-2">
        {data.achievements.map((a, i) => (
          <li key={i} className="text-xs">{a.title} - {a.date}</li>
        ))}
      </ul>
    </Card>
  )
}