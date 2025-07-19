"use client"

import { Card } from "@/components/ui/card"
import { Sigma, Award } from "lucide-react"

interface MathData {
  streak: number
  lastSolved: string
  xp: number
  totalSolved: number
}

export default function MathTracker({ data }: { data: MathData }) {
  return (
    <Card className="p-4" aria-label="Math Problem Solving">
      <div className="flex items-center mb-2">
        <Sigma className="text-indigo-600 mr-2" aria-hidden="true" />
        <h3 className="text-lg font-bold">Math Problem Streak: {data.streak}</h3>
        <Award className="ml-auto text-orange-500" aria-label="XP" />
        <span className="ml-2 font-bold">{data.xp} XP</span>
      </div>
      <div className="mt-2 text-sm">
        <span>Last Problem Solved: {data.lastSolved}</span>
      </div>
      <div className="mt-2 text-sm">
        <span>Cumulative: {data.totalSolved} problems solved</span>
      </div>
    </Card>
  )
}