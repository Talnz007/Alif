"use client"

import { motion } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Trophy, Star, Target } from "lucide-react"
import { StreakData } from "../dashboard"
import { useEffect, useState } from "react"

interface BadgeDisplay {
  icon: any
  label: string
  achieved: boolean
}

export default function StreakTracker({ userId }: { userId: string }) {
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStreak() {
      setLoading(true)
      try {
        const response = await fetch(`/api/users/${userId}/streak`, {
          headers: {'x-user-id': userId}
        });
        if (!response.ok) throw new Error("Failed to fetch streak");
        const data = await response.json();
        setStreakData(data);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(String(err));
        }
      } finally {
        setLoading(false);
      }
    }
    if (userId) fetchStreak()
  }, [userId])

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return <div className="p-4 text-red-600">{error}</div>
  if (!streakData) return <div className="p-4">No streak data available</div>

  const defaultBadges: BadgeDisplay[] = [
    { icon: Trophy, label: "7-Day Streak", achieved: false },
    { icon: Star, label: "Quick Learner", achieved: false },
    { icon: Target, label: "Focus Master", achieved: false },
  ]
  const badges = [...defaultBadges]
  if (streakData.current >= 7) badges[0].achieved = true

  return (
    <div className="p-4 space-y-4">
      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Study Streak</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{streakData.current}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-semibold">{streakData.longest}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Weekly Progress</span>
              <span>{streakData.weeklyProgress}%</span>
            </div>
            <Progress value={streakData.weeklyProgress} className="h-2" />
          </div>

          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Current Level</span>
              <span className="text-sm text-blue-600 dark:text-blue-400">
                {streakData.level.charAt(0).toUpperCase() + streakData.level.slice(1)}
              </span>
            </div>
            <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded">
              <motion.div
                className="absolute left-0 top-0 h-full bg-blue-600 dark:bg-blue-400 rounded"
                style={{ width: `${(streakData.current / streakData.nextMilestone) * 100}%` }}
                initial={{ width: 0 }}
                animate={{ width: `${(streakData.current / streakData.nextMilestone) * 100}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {streakData.nextMilestone - streakData.current} days to next level
            </p>
          </div>
        </div>
      </Card>

      {/*<Card className="p-4">*/}
      {/*  <h3 className="text-lg font-semibold mb-4">Achievements</h3>*/}
      {/*  <div className="space-y-3">*/}
      {/*    {badges.map((badge, index) => (*/}
      {/*      <motion.div*/}
      {/*        key={badge.label}*/}
      {/*        initial={{ opacity: 0, y: 10 }}*/}
      {/*        animate={{ opacity: 1, y: 0 }}*/}
      {/*        transition={{ delay: index * 0.1 }}*/}
      {/*        className={`flex items-center p-2 rounded-lg ${*/}
      {/*          badge.achieved ? "bg-blue-50 dark:bg-blue-900/20" : "bg-gray-50 dark:bg-gray-800/50"*/}
      {/*        }`}*/}
      {/*      >*/}
      {/*        <badge.icon*/}
      {/*          className={`h-5 w-5 mr-3 ${badge.achieved ? "text-blue-600 dark:text-blue-400" : "text-gray-400"}`}*/}
      {/*        />*/}
      {/*        <div>*/}
      {/*          <p className="text-sm font-medium">{badge.label}</p>*/}
      {/*          <p className="text-xs text-gray-600 dark:text-gray-400">*/}
      {/*            {badge.achieved ? "Achieved" : "In Progress"}*/}
      {/*          </p>*/}
      {/*        </div>*/}
      {/*      </motion.div>*/}
      {/*    ))}*/}
      {/*  </div>*/}
      {/*</Card>*/}

      {!streakData.todayCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg"
        >
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Don't break your streak! Complete an assignment today to maintain your progress.
          </p>
        </motion.div>
      )}
    </div>
  )
}