"use client"

import { useState, useEffect } from "react"
import { Users, Globe, ArrowLeft, ArrowRight, User, Loader2, Trophy, Medal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { useAuth } from "@/contexts/auth-context" // Import auth context to get current user

interface LeaderboardEntry {
  id: string
  username: string
  points: number
  rank: number
  avatar_url?: string | null
}

interface LeaderboardRange {
  label: string
  start: number
  end: number
}

export default function Leaderboard() {
  const { user } = useAuth() // Get current user
  const [users, setUsers] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentRange, setCurrentRange] = useState<LeaderboardRange>({ label: "Top 50", start: 1, end: 50 })
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null)

  const ranges: LeaderboardRange[] = [
    { label: "Top 50", start: 1, end: 50 },
    { label: "51-100", start: 51, end: 100 },
    { label: "101-150", start: 101, end: 150 },
    { label: "151-200", start: 151, end: 200 }
  ]

  // Fetch leaderboard data
  useEffect(() => {
    async function fetchLeaderboard() {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/leaderboard?type=global&start=${currentRange.start}&end=${currentRange.end}`)

        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard")
        }

        const data = await response.json()
        console.log(`Leaderboard data (${currentRange.label}):`, data)

        // Make sure we have an array
        if (Array.isArray(data)) {
          setUsers(data)
        } else {
          console.error("Expected array but got:", data)
          setUsers([])
        }

        // Fetch current user's rank if logged in
        if (user?.id) {
          try {
            const userRankResponse = await fetch(`/api/leaderboard/user-rank?userId=${user.id}`)
            if (userRankResponse.ok) {
              const userRankData = await userRankResponse.json()
              setUserRank(userRankData)
            }
          } catch (err) {
            console.error("Error fetching user rank:", err)
          }
        }
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        // Generate fallback data based on the range
        setUsers(
          Array.from({ length: 10 }, (_, i) => ({
            id: `fallback-${i + currentRange.start}`,
            username: `User${i + currentRange.start}`,
            points: Math.floor(Math.random() * 1000) + (500 - (i * 50)),
            rank: i + currentRange.start
          }))
        )
      } finally {
        setIsLoading(false)
      }
    }

    fetchLeaderboard()
  }, [currentRange, user?.id])

  function changeRange(range: LeaderboardRange) {
    setCurrentRange(range)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
    >
      <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
        <Trophy className="mr-2" /> Leaderboard
      </h2>

      {/* Simplified tab - only Global */}
      <div className="flex mb-4 border-b dark:border-gray-700">
        <div className="py-2 px-4 text-blue-600 border-b-2 border-blue-600 font-medium flex items-center">
          <Globe className="mr-2 h-4 w-4" /> Global Rankings
        </div>
      </div>

      {/* Range selector */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <span className="text-sm text-gray-600 dark:text-gray-400">Select Range:</span>
        {ranges.map((range) => (
          <Button
            key={range.label}
            variant={currentRange.label === range.label ? "default" : "outline"}
            size="sm"
            onClick={() => changeRange(range)}
            className="text-xs"
          >
            {range.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {users.length > 0 ? users.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-8 text-center font-semibold mr-2">
                  {entry.rank <= 3 ? (
                    <div className="flex justify-center">
                      <Medal className={`h-5 w-5 ${
                        entry.rank === 1 ? "text-yellow-500" : 
                        entry.rank === 2 ? "text-gray-400" : "text-amber-700"
                      }`} />
                    </div>
                  ) : (
                    <span className="text-gray-600 dark:text-gray-300">{entry.rank}</span>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center mr-3 overflow-hidden">
                  {entry.avatar_url ? (
                    <img
                      src={entry.avatar_url}
                      alt={entry.username}
                      className="w-10 h-10 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `https://avatar.vercel.sh/${entry.username}`;
                      }}
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <span className="text-gray-800 dark:text-white font-medium">
                  {entry.username}
                  {user?.id === entry.id && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 py-0.5 px-1.5 rounded">
                      You
                    </span>
                  )}
                </span>
              </div>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{entry.points} pts</span>
            </motion.div>
          )) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No data available for this leaderboard range
            </div>
          )}

          {/* Pagination controls */}
          <div className="flex justify-between items-center pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const prevIndex = ranges.findIndex(r => r.label === currentRange.label) - 1;
                if (prevIndex >= 0) changeRange(ranges[prevIndex]);
              }}
              disabled={ranges[0].label === currentRange.label}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Previous
            </Button>

            <span className="text-sm text-gray-600 dark:text-gray-400">
              Showing ranks {currentRange.start}-{currentRange.end}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const nextIndex = ranges.findIndex(r => r.label === currentRange.label) + 1;
                if (nextIndex < ranges.length) changeRange(ranges[nextIndex]);
              }}
              disabled={ranges[ranges.length-1].label === currentRange.label}
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {/* Current user rank (if not in current view) */}
          {userRank && (userRank.rank < currentRange.start || userRank.rank > currentRange.end) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 border border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-900/30 rounded-lg"
            >
              <h3 className="text-sm font-semibold mb-2 text-blue-800 dark:text-blue-400">Your Position</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 text-center font-semibold mr-2">
                    <span className="text-gray-600 dark:text-gray-300">{userRank.rank}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-blue-200 dark:bg-blue-800 flex items-center justify-center mr-3 overflow-hidden">
                    <User className="h-5 w-5 text-blue-500 dark:text-blue-300" />
                  </div>
                  <span className="text-gray-800 dark:text-white font-medium">
                    {userRank.username}
                    <span className="ml-2 text-xs bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200 py-0.5 px-1.5 rounded">
                      You
                    </span>
                  </span>
                </div>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{userRank.points} pts</span>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  )
}