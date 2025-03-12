"use client"

import { BarChart2, TrendingUp, Calendar, Clock } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { UserProgressData } from "./dashboard"

export default function PerformanceOverview({ data }: { data?: UserProgressData }) {
  // Use provided data or fallback to defaults
  const progressData = data || {
    overallProgress: 75,
    studyStreak: 7,
    timeSpentHours: 12.5,
    topSubjects: [
      { name: 'Mathematics', progress: 85 },
      { name: 'Physics', progress: 78 },
      { name: 'Computer Science', progress: 92 }
    ]
  }
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
        <BarChart2 className="mr-2" /> Performance Overview
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-800 dark:text-white">
            <TrendingUp className="mr-2 h-5 w-5" /> Overall Progress
          </h3>
          <Progress value={progressData.overallProgress} className="h-2 mb-2" />
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You've completed {progressData.overallProgress}% of your goals
          </p>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-800 dark:text-white">
            <Calendar className="mr-2 h-5 w-5" /> Study Streak
          </h3>
          <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            {progressData.studyStreak} {progressData.studyStreak === 1 ? 'day' : 'days'}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Keep it up!</p>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 flex items-center text-gray-800 dark:text-white">
            <Clock className="mr-2 h-5 w-5" /> Time Spent Learning
          </h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">
            {progressData.timeSpentHours} hours
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-300">This week</p>
        </div>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Top Subjects</h3>
          <ul className="space-y-2">
            {progressData.topSubjects.map((subject, index) => (
              <li key={index} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-300">{subject.name}</span>
                  <span className="font-semibold text-gray-800 dark:text-white">{subject.progress}%</span>
                </div>
                <Progress value={subject.progress} className="h-1" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}