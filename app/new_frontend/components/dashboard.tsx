"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion } from "framer-motion"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import PerformanceOverview from "@/components/performance-overview"
import Leaderboard from "@/components/leaderboard"
import StreakTracker from "@/components/streak/streak-tracker"
import AssignmentStats from "@/components/assignment-stats"
import { useToast } from "@/components/ui/use-toast"
import { Award, BookOpen, GraduationCap, Loader2, Trophy, AlertCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import Link from "next/link"
import { useBadgeNotification } from "@/components/ui/badge-notification"
import { useUser } from "@/hooks/use-user"

export interface UserProgressData {
  overallProgress: number
  studyStreak: number
  timeSpentHours: number
  topSubjects: {
    name: string
    progress: number
  }[]
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
  recentAssignments: {
    id: string
    title: string
    score: number
    date: string
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
  // Get real authenticated user
  const { user, loading: userLoading, error: userError } = useUser();

  // Use real user ID or null if not authenticated
  const userId = user?.id || null;

  const [isLoading, setIsLoading] = useState(true)
  const [progressData, setProgressData] = useState<UserProgressData | null>(null)
  const [streakData, setStreakData] = useState<StreakData | null>(null)
  const [assignmentData, setAssignmentData] = useState<AssignmentData | null>(null)
  const [badgeCount, setBadgeCount] = useState({ earned: 0, total: 0 })
  const [recentBadges, setRecentBadges] = useState<Badge[]>([])
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { BadgeNotificationComponent, showBadgeNotification } = useBadgeNotification()

  // Refs to prevent loops and multiple calls
  const hasInitialized = useRef(false)
  const badgeCheckInProgress = useRef(false)
  const initialDataLoaded = useRef(false)

  // Show loading while waiting for user auth to resolve
  if (userLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg">Loading authentication...</p>
      </div>
    );
  }

  // Show error if user auth failed
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
    );
  }

  // Show auth required if no user
  if (!user || !userId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="w-12 h-12 text-blue-500 mb-4" />
        <p className="text-lg">Please log in to view your progress.</p>
        <Link href="/login" className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Go to Login
        </Link>
      </div>
    );
  }

  console.log("✅ Dashboard rendering for authenticated user:", { id: userId, username: user.username });

  // Stable version of showBadgeNotification to prevent dependency issues
  const stableShowBadgeNotification = useCallback((badge: Badge) => {
    showBadgeNotification(badge);
  }, []);

  // Memoized badge data fetcher
  const fetchBadgeData = useCallback(async (skipLogging = false) => {
    if (!userId) return;

    try {
      if (!skipLogging) {
        console.log('🔄 Fetching badge data for user:', userId);
      }

      const [earnedBadgesResponse, allBadgesResponse] = await Promise.all([
        fetch(`/api/badges?userId=${userId}`),
        fetch(`/api/badges?userId=${userId}&showAll=true`)
      ]);

      if (earnedBadgesResponse.ok && allBadgesResponse.ok) {
        const earnedBadges = await earnedBadgesResponse.json();
        const allBadges = await allBadgesResponse.json();

        setBadgeCount({
          earned: earnedBadges.length,
          total: allBadges.length
        });

        // Get recent badges (last 3 earned)
        const sortedEarnedBadges = earnedBadges
          .filter((badge: Badge) => badge.earned_at)
          .sort((a: Badge, b: Badge) =>
            new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime()
          )
          .slice(0, 3);

        setRecentBadges(sortedEarnedBadges);
      }
    } catch (error) {
      console.error('❌ Error fetching badge data:', error);
    }
  }, [userId]);

  // Memoized badge check function with proper guards
  const triggerBadgeCheck = useCallback(async () => {
    if (!userId) return;

    // Prevent multiple simultaneous badge checks
    if (badgeCheckInProgress.current) {
      console.log('🔄 Badge check already in progress, skipping...');
      return;
    }

    // Don't run badge check until initial data is loaded
    if (!initialDataLoaded.current) {
      console.log('⏸️ Skipping badge check - initial data not loaded yet');
      return;
    }

    try {
      badgeCheckInProgress.current = true;
      console.log('🎯 Triggering badge check for user:', userId);

      const response = await fetch(`/api/users/${userId}/badges/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activityType: 'dashboard_visit',
          metadata: { timestamp: new Date().toISOString() }
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('🏆 Badge check result:', result);

        if (result.newBadges && result.newBadges.length > 0) {
          // Refresh badge data to show new badges (skip logging to avoid spam)
          await fetchBadgeData(true);

          // Show notification for new badges
          result.newBadges.forEach((badge: Badge, index: number) => {
            setTimeout(() => {
              stableShowBadgeNotification(badge);
            }, index * 2000); // Stagger notifications
          });
        }
      }
    } catch (error) {
      console.error('❌ Error checking badges:', error);
    } finally {
      badgeCheckInProgress.current = false;
    }
  }, [userId, fetchBadgeData, stableShowBadgeNotification]);

  // Main initialization effect - runs only once per user
  useEffect(() => {
    if (hasInitialized.current || !userId) {
      return;
    }

    hasInitialized.current = true;

    async function fetchDashboardData() {
      setIsLoading(true)
      setError(null)

      try {
        console.log('🔄 Fetching dashboard data for user:', userId)

        // Prepare headers
        const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
        // Only add user ID header if it exists
        if (userId) {
          headers['x-user-id'] = userId;
        }


        // Fetch all data in parallel
        const [
          progressResponse,
          streakResponse,
          assignmentResponse,
          earnedBadgesResponse,
          allBadgesResponse
        ] = await Promise.all([
          fetch(`/api/users/${userId}/progress`, { headers }),
          fetch(`/api/users/${userId}/streak`, { headers }),
          fetch(`/api/assignments/stats`, { headers }),
          fetch(`/api/badges?userId=${userId}`, { headers }),
          fetch(`/api/badges?userId=${userId}&showAll=true`, { headers })
        ])

        // Check for API errors
        const responses = [progressResponse, streakResponse, assignmentResponse, earnedBadgesResponse, allBadgesResponse]
        const failedResponses = responses.filter(r => !r.ok)

        if (failedResponses.length > 0) {
          console.error('❌ Some API calls failed:', failedResponses.map(r => r.url))
        }

        const progress = progressResponse.ok ? await progressResponse.json() : null
        const streak = streakResponse.ok ? await streakResponse.json() : null
        const assignments = assignmentResponse.ok ? await assignmentResponse.json() : null
        const earnedBadges = earnedBadgesResponse.ok ? await earnedBadgesResponse.json() : []
        const allBadges = allBadgesResponse.ok ? await allBadgesResponse.json() : []

        console.log('📊 Dashboard data loaded:', {
          userId,
          progress: !!progress,
          streak: !!streak,
          assignments: !!assignments,
          earnedBadges: earnedBadges.length,
          totalBadges: allBadges.length
        })

        setProgressData(progress)
        setStreakData(streak)
        setAssignmentData(assignments)

        // Set badge counts correctly
        setBadgeCount({
          earned: earnedBadges.length,
          total: allBadges.length
        })

        // Get recent badges (last 3 earned)
        const sortedEarnedBadges = earnedBadges
          .filter((badge: Badge) => badge.earned_at)
          .sort((a: Badge, b: Badge) =>
            new Date(b.earned_at!).getTime() - new Date(a.earned_at!).getTime()
          )
          .slice(0, 3)

        setRecentBadges(sortedEarnedBadges)

        // Mark initial data as loaded
        initialDataLoaded.current = true;

        // Show notification for newly earned badges (if any)
        if (sortedEarnedBadges.length > 0) {
          const latestBadge = sortedEarnedBadges[0]
          const badgeEarnedRecently = latestBadge.earned_at &&
            new Date(latestBadge.earned_at).getTime() > Date.now() - (5 * 60 * 1000) // 5 minutes

          if (badgeEarnedRecently) {
            stableShowBadgeNotification(latestBadge)
          }
        }

      } catch (error) {
        console.error("❌ Error loading dashboard data:", error)
        setError("Failed to load dashboard data. Please try refreshing the page.")
        toast({
          title: "Error",
          description: "Failed to load your progress data. Please try again.",
          variant: "destructive"
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()
  }, [userId, toast]) // Only depend on userId, not the functions

  // Separate effect for the delayed badge check - runs only after initial load
  useEffect(() => {
    if (!initialDataLoaded.current || isLoading || !userId) {
      return;
    }

    // Single delayed badge check after everything is loaded
    const timeoutId = setTimeout(() => {
      triggerBadgeCheck();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [initialDataLoaded.current, isLoading, userId]);

  // Reset hasInitialized when user changes
  useEffect(() => {
    hasInitialized.current = false;
    initialDataLoaded.current = false;
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg">Loading your progress...</p>
        <p className="text-sm text-gray-500">User: {user.username} ({userId})</p>
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
            hasInitialized.current = false;
            initialDataLoaded.current = false;
            window.location.reload();
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Badge Notification */}
      {BadgeNotificationComponent}

      <div>
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 mb-2">
          Your Learning Progress
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Track your performance, achievements, and academic growth
        </p>
        <p className="text-sm text-gray-500">Welcome back, {user.username}!</p>
      </div>

      {/* Quick Stats Cards */}
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

      {/* Recent Badges Section (if any earned) */}
      {recentBadges.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Award className="mr-2 h-5 w-5 text-amber-500" />
              Recent Achievements
            </h3>
            <Link href="/badges" className="text-blue-600 hover:text-blue-800 text-sm">
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
                    onError={(e) => {
                      e.currentTarget.src = '/badges/default.png';
                    }}
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

      {/* Badge Check Button for Testing */}
      <div className="flex justify-center">
        <button
          onClick={triggerBadgeCheck}
          disabled={badgeCheckInProgress.current}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {badgeCheckInProgress.current ? '⏳ Checking...' : '🎯 Check for New Badges'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - 2/3 width */}
        <div className="lg:col-span-2 space-y-6">
          {progressData && <PerformanceOverview data={progressData} />}

          <Tabs defaultValue="assignments" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="assignments">My Assignments</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>
            <TabsContent value="assignments">
              <AssignmentStats data={assignmentData} />
            </TabsContent>
            <TabsContent value="leaderboard">
              <Leaderboard />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - 1/3 width */}
        <div className="lg:col-span-1">
          {streakData && <StreakTracker data={streakData} />}
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