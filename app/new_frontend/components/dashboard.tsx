"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PerformanceOverview from "@/components/performance-overview"
import Leaderboard from "@/components/leaderboard"
import StreakTracker from "@/components/streak/streak-tracker"
import QuizStats from "@/components/quiz-stats"
import { useToast } from "@/components/ui/use-toast"
import { Award, BookOpen, GraduationCap, Loader2, Trophy, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useBadgeNotification } from "@/components/ui/badge-notification"
import { useUser } from "@/hooks/use-user"
import RecommendationsFetcher from "@/components/dashboard/RecommendationsFetcher"

export interface UserProgressData {
  overallProgress: number
  studyStreak: number
  timeSpentHours: number
  topSubjects: { name: string; progress: number }[]
  assignmentCount: number
}

export interface StreakData {
  current: number
  longest: number
  todayCompleted: boolean
  weeklyProgress: number
  level: "bronze" | "silver" | "gold" | "platinum"
  nextMilestone: number
}

export interface AssignmentData {
  totalCompleted: number
  averageScore: number
  currentStreak: number
  recentQuizzes: {
    id: string
    title: string
    score: number
    date: string
    metadata?: string | object
  }[]
}

interface Badge {
  id: number
  name: string
  description: string
  image_url: string
  is_earned: boolean
  progress: number
  earned_at?: string
}

export default function Dashboard() {
  const { user, loading: userLoading, error: userError } = useUser()
  const userId = user?.id || null

  const [isLoading, setIsLoading] = useState(true)
  const [progressData, setProgressData] = useState<UserProgressData | null>(null)
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null)
  const [badgeCount, setBadgeCount] = useState({ earned: 0, total: 0 })
  const [recentBadges, setRecentBadges] = useState<Badge[]>([])
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { BadgeNotificationComponent, showBadgeNotification } = useBadgeNotification()

  const hasInitialized = useRef(false)
  const badgeCheckInProgress = useRef(false)
  const initialDataLoaded = useRef(false)

  const stableShowBadgeNotification = useCallback((badge: Badge) => {
    showBadgeNotification(badge)
  }, [showBadgeNotification])

  const fetchBadgeData = useCallback(async (skipLogging = false) => {
    if (!userId) return
    try {
      if (!skipLogging) console.log('🔄 Fetching badge data for user:', userId)
      const headers = { 'Content-Type': 'application/json', 'x-user-id': userId }
      const [earnedBadgesResponse, allBadgesResponse] = await Promise.all([
        fetch(`/api/badges?userId=${userId}`, { headers }),
        fetch(`/api/badges?userId=${userId}&showAll=true`, { headers })
      ])
      if (earnedBadgesResponse.ok && allBadgesResponse.ok) {
        const earnedBadges = await earnedBadgesResponse.json()
        const allBadges = await allBadgesResponse.json()
        setBadgeCount({ earned: earnedBadges.length, total: allBadges.length })
        const sortedEarnedBadges = earnedBadges
          .filter((badge: Badge) => badge.earned_at)
          .sort((a: Badge, b: Badge) => new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime())
          .slice(0, 3)
        setRecentBadges(sortedEarnedBadges)
      }
    } catch (error) {
      console.error('❌ Error fetching badge data:', error)
    }
  }, [userId])

  const triggerBadgeCheck = useCallback(async () => {
    if (!userId) return
    if (badgeCheckInProgress.current) {
      console.log('🔄 Badge check already in progress, skipping...')
      return
    }
    if (!initialDataLoaded.current) {
      console.log('⏸️ Skipping badge check - initial data not loaded yet')
      return
    }
    try {
      badgeCheckInProgress.current = true
      console.log('🎯 Triggering badge check for user:', userId)
      const response = await fetch(`/api/users/${userId}/badges/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-user-id': userId },
        body: JSON.stringify({ activityType: 'dashboard_visit', metadata: { timestamp: new Date().toISOString() } })
      })
      if (response.ok) {
        const result = await response.json()
        console.log('🏆 Badge check result:', result)
        if (result.newBadges && result.newBadges.length > 0) {
          await fetchBadgeData(true)
          result.newBadges.forEach((badge: Badge, index: number) => {
            setTimeout(() => stableShowBadgeNotification(badge), index * 2000)
          })
        }
      }
    } catch (error) {
      console.error('❌ Error checking badges:', error)
    } finally {
      badgeCheckInProgress.current = false
    }
  }, [userId, fetchBadgeData, stableShowBadgeNotification])

  useEffect(() => {
    if (hasInitialized.current || !userId) return
    hasInitialized.current = true
    async function fetchDashboardData() {
      setIsLoading(true)
      setError(null)
      try {
        console.log('🔄 Fetching dashboard data for user:', userId)
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'x-user-id': userId }
        const [
          progressResponse,
          streakResponse,
          assignmentResponse,
          earnedBadgesResponse,
          allBadgesResponse
        ] = await Promise.all([
          fetch(`/api/users/${userId}/progress`, { headers }),
          fetch(`/api/users/${userId}/streak`, { headers }),
          fetch(`/api/users/${userId}/stats`, { headers }), // Use correct endpoint
          fetch(`/api/badges?userId=${userId}`, { headers }),
          fetch(`/api/badges?userId=${userId}&showAll=true`, { headers })
        ])
        const responses = [progressResponse, streakResponse, assignmentResponse, earnedBadgesResponse, allBadgesResponse]
        const failedResponses = responses.filter(r => !r.ok)
        if (failedResponses.length > 0) console.error('❌ Some API calls failed:', failedResponses.map(r => r.url))
        const progress = progressResponse.ok ? await progressResponse.json() : null
        const streak = streakResponse.ok ? await streakResponse.json() : null
        const assignments = assignmentResponse.ok ? await assignmentResponse.json() : null
        const earnedBadges = earnedBadgesResponse.ok ? await earnedBadgesResponse.json() : []
        const allBadges = allBadgesResponse.ok ? await allBadgesResponse.json() : []
        console.log('📊 Dashboard data loaded:', { userId, progress: !!progress, streak: !!streak, assignments: !!assignments, earnedBadges: earnedBadges.length, totalBadges: allBadges.length })
        setProgressData(progress)
        setStreakData(streak)
        setAssignmentData(assignments)
        setBadgeCount({ earned: earnedBadges.length, total: allBadges.length })
        const sortedEarnedBadges = earnedBadges
          .filter((badge: Badge) => badge.earned_at)
          .sort((a: Badge, b: Badge) => new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime())
          .slice(0, 3)
        setRecentBadges(sortedEarnedBadges)
        initialDataLoaded.current = true
        if (sortedEarnedBadges.length > 0) {
          const latestBadge = sortedEarnedBadges[0]
          const badgeEarnedRecently = latestBadge.earned_at && new Date(latestBadge.earned_at).getTime() > Date.now() - (5 * 60 * 1000)
          if (badgeEarnedRecently) stableShowBadgeNotification(latestBadge)
        }
      } catch (error) {
        console.error("❌ Error loading dashboard data:", error)
        setError("Failed to load dashboard data. Please try refreshing the page.")
        toast({ title: "Error", description: "Failed to load your progress data. Please try again.", variant: "destructive" })
      } finally {
        setIsLoading(false)
      }
    }
    fetchDashboardData()
  }, [userId, toast, stableShowBadgeNotification, fetchBadgeData, triggerBadgeCheck])

  useEffect(() => {
    if (!initialDataLoaded.current || isLoading || !userId) return
    const timeoutId = setTimeout(() => triggerBadgeCheck(), 3000)
    return () => clearTimeout(timeoutId)
  }, [initialDataLoaded.current, isLoading, userId, triggerBadgeCheck])

  useEffect(() => {
    hasInitialized.current = false
    initialDataLoaded.current = false
  }, [userId])

  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg">Loading authentication...</p>
      </div>
    )
  }

  if (userError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600 dark:text-red-400">Authentication error: {userError.message}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!user || !userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="w-12 h-12 text-blue-500 mb-4" />
        <p className="text-lg">Please log in to view your progress.</p>
        <Link href="/login" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Login
        </Link>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg">Loading your progress...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={() => {
            hasInitialized.current = false
            initialDataLoaded.current = false
            window.location.reload()
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8 dark:bg-gray-900">
      {BadgeNotificationComponent}
      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
          Your Learning Progress
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your performance, achievements, and academic growth
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">Welcome back, {user.username}!</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <QuickStatCard
          title="Assignments"
          value={progressData?.assignmentCount || 0}
          label="completed"
          icon={<BookOpen className="h-5 w-5 text-indigo-500" />}
          color="bg-indigo-50 dark:bg-indigo-900/20"
        />
        <QuickStatCard
          title="Avg. Score"
          value={assignmentData?.averageScore || 0}
          label="%"
          icon={<GraduationCap className="h-5 w-5 text-green-500" />}
          color="bg-green-50 dark:bg-green-900/20"
        />
        <Link href="/badges" className="block">
          <QuickStatCard
            title="Badges"
            value={`${badgeCount.earned}/${badgeCount.total}`}
            label="earned"
            icon={<Award className="h-5 w-5 text-amber-500" />}
            color="bg-amber-50 dark:bg-amber-900/20"
            isClickable
          />
        </Link>
        <QuickStatCard
          title="Streak"
          value={streakData?.current || 0}
          label="days"
          icon={<Trophy className="h-5 w-5 text-blue-500" />}
          color="bg-blue-50 dark:bg-blue-900/20"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-fit gap-6">
        <RecommendationsFetcher userId={userId} />
      </div>
      {recentBadges.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Award className="mr-2 h-5 w-5 text-amber-500" />
              Recent Achievements
            </h3>
            <Link href="/badges" className="text-blue-600 dark:text-blue-400 hover:text-blue-800 text-sm">
              View all →
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto">
            {recentBadges.map((badge) => (
              <div key={badge.id} className="flex-shrink-0 text-center">
                <div className="w-16 h-16 mx-auto mb-2 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-full flex items-center justify-center border border-blue-200 dark:border-blue-700">
                  <img
                    src={badge.image_url || '/badges/default.png'}
                    alt={badge.name}
                    className="w-10 h-10 object-contain"
                    onError={(e) => { e.currentTarget.src = '/badges/default.png' }}
                  />
                </div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-20">
                  {badge.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {badge.earned_at && new Date(badge.earned_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-fit gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="assignments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assignments">Recent Quizzes</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            <TabsContent value="assignments">
              <QuizStats userId={userId} />
            </TabsContent>
            <TabsContent value="leaderboard">
              <Leaderboard />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function QuickStatCard({
  title,
  value,
  label,
  icon,
  color,
  isClickable = false
}: {
  title: string
  value: number | string
  label: string
  icon: React.ReactNode
  color: string
  isClickable?: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-4 ${color} shadow-sm ${isClickable ? 'hover:shadow-md transition-shadow cursor-pointer' : ''}`}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <div className="flex items-baseline mt-1">
            <p className="text-2xl font-semibold">{value}</p>
            <p className="ml-1 text-sm text-gray-500">{label}</p>
          </div>
        </div>
        <div className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-sm">
          {icon}
        </div>
      </div>
    </motion.div>
  )
}