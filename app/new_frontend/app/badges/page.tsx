"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { AlertCircle, CheckCircle, Lock, Trophy, Award } from 'lucide-react'

// Badge interface based on your database structure
// Fixed ID type to accept both string and number
interface BadgeType {
  id: string | number
  name: string
  description: string
  image_url: string
  created_at: string
  is_earned: boolean
  progress: number
  earned_at?: string
  category: string
}

// Helper to derive badge category from description
function deriveBadgeCategory(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('streak') || desc.includes('consecutive')) return 'Streaks';
  if (desc.includes('login')) return 'Login';
  if (desc.includes('summariz')) return 'Content';
  if (desc.includes('audio')) return 'Content';
  if (desc.includes('document')) return 'Content';
  if (desc.includes('leaderboard')) return 'Performance';
  if (desc.includes('goal')) return 'Goals';
  if (desc.includes('collect')) return 'Collection';
  return 'General';
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<BadgeType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedBadge, setSelectedBadge] = useState<BadgeType | null>(null)
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    async function fetchBadges() {
      try {
        // Get the userId from localStorage with better fallback
        const userId = localStorage.getItem('user_id') || '1';

        // Set showAll based on active tab
        const showAll = activeTab === 'all' || activeTab === 'locked';

        console.log(`Fetching badges for userId: ${userId}, showAll: ${showAll}`);

        // Include both parameters in the API call
        const response = await fetch(`/api/badges?userId=${userId}&showAll=${showAll}`)

        if (!response.ok) {
          throw new Error('Failed to fetch badges')
        }

        const data = await response.json()
        console.log(`Fetched ${data.length} badges`);

        // Process badges to add categories
        const processedBadges = data.map((badge: any) => ({
          ...badge,
          category: deriveBadgeCategory(badge.description),
          is_earned: badge.is_earned || false,
          progress: badge.progress || 0
        }))

        setBadges(processedBadges)
      } catch (error) {
        console.error('Error fetching badges:', error)
        toast({
          title: 'Error',
          description: 'Failed to load badges. Please try again later.',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBadges()
  }, [toast, activeTab])

  // Calculate badges stats
  const earnedCount = badges.filter(badge => badge.is_earned).length
  const totalCount = badges.length
  const completionPercentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0

  // Group badges by category
  const categories = [...new Set(badges.map(badge => badge.category))]

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 border-4 border-blue-500 border-solid rounded-full border-t-transparent animate-spin"></div>
        <p className="mt-4 text-lg">Loading your achievements...</p>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Achievement Badges</h1>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Trophy className="h-6 w-6 text-yellow-500" />
          <span className="text-xl font-medium">{earnedCount} of {totalCount} badges earned</span>
        </div>
        <div className="max-w-md mx-auto">
          <Progress value={completionPercentage} className="h-3" />
          <p className="mt-2 text-sm text-gray-500">{completionPercentage}% Complete</p>
        </div>
      </div>

      {/* Fixed: Added onValueChange handler to update activeTab state */}
      <Tabs
        defaultValue="all"
        className="w-full"
        onValueChange={(value) => setActiveTab(value)}
      >
        <TabsList className="flex justify-center mb-8 flex-wrap">
          <TabsTrigger value="all">All Badges</TabsTrigger>
          <TabsTrigger value="earned">Earned ({earnedCount})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({totalCount - earnedCount})</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">
          <BadgeGrid
            badges={badges}
            selectedBadge={selectedBadge}
            setSelectedBadge={setSelectedBadge}
          />
        </TabsContent>

        <TabsContent value="earned">
          <BadgeGrid
            badges={badges.filter(badge => badge.is_earned)}
            selectedBadge={selectedBadge}
            setSelectedBadge={setSelectedBadge}
          />
        </TabsContent>

        <TabsContent value="locked">
          <BadgeGrid
            badges={badges.filter(badge => !badge.is_earned)}
            selectedBadge={selectedBadge}
            setSelectedBadge={setSelectedBadge}
          />
        </TabsContent>

        {categories.map(category => (
          <TabsContent key={category} value={category}>
            <BadgeGrid
              badges={badges.filter(badge => badge.category === category)}
              selectedBadge={selectedBadge}
              setSelectedBadge={setSelectedBadge}
            />
          </TabsContent>
        ))}
      </Tabs>

      {selectedBadge && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-10"
        >
          <Card className="border-2 border-blue-200 dark:border-blue-900">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{selectedBadge.name}</CardTitle>
                <Badge variant={selectedBadge.is_earned ? "secondary" : "outline"} className={`ml-2 ${selectedBadge.is_earned ? "bg-green-500 hover:bg-green-600" : ""}`}>
                  {selectedBadge.is_earned ? "Earned" : "Locked"}
                </Badge>
              </div>
              <CardDescription>{selectedBadge.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col md:flex-row gap-6">
              <div className="flex-shrink-0 flex justify-center">
                <div className="relative w-32 h-32">
                  <img
                    src={selectedBadge.image_url}
                    alt={selectedBadge.name}
                    className={`w-full h-full object-contain ${!selectedBadge.is_earned ? "filter grayscale opacity-50" : ""}`}
                    onError={(e) => {
                      // Fallback if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.onerror = null; // Prevent further error events
                      target.src = '/placeholder-badge.png';
                    }}
                  />
                  {!selectedBadge.is_earned && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold mb-2">How to earn:</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedBadge.description}</p>

                <h3 className="font-semibold mb-2">Completion:</h3>
                <Progress value={selectedBadge.progress} className="h-2 mb-2" />
                <p className="text-sm text-gray-500">{selectedBadge.progress}% Complete</p>
              </div>
            </CardContent>
            <CardFooter>
              {selectedBadge.is_earned ? (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {/* Fixed: Handle potential undefined or invalid dates */}
                  <span>
                    Earned on {selectedBadge.earned_at ?
                      new Date(selectedBadge.earned_at).toLocaleDateString() :
                      'Unknown date'}
                  </span>
                </div>
              ) : (
                <div className="flex items-center text-gray-500">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <span>Complete the requirements to earn this badge</span>
                </div>
              )}
            </CardFooter>
          </Card>
        </motion.div>
      )}
    </div>
  )
}

function BadgeGrid({ badges, selectedBadge, setSelectedBadge }: {
  badges: BadgeType[],
  selectedBadge: BadgeType | null,
  setSelectedBadge: (badge: BadgeType | null) => void
}) {
  if (badges.length === 0) {
    return <div className="text-center py-12">No badges in this category yet</div>
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {badges.map(badge => (
        <motion.div
          key={badge.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={`cursor-pointer ${selectedBadge?.id === badge.id ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
          onClick={() => setSelectedBadge(badge)}
        >
          <Card className="h-full flex flex-col items-center justify-between p-4 transition-all duration-300 hover:shadow-lg">
            <div className="relative w-24 h-24 mb-2">
              <img
                  src={badge.image_url}
                  alt={badge.name}
                  className={`w-full h-full object-contain ${!badge.is_earned ? "filter grayscale opacity-50" : ""}`}
                  onError={(e) => {
                    // Improved error handling
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('/placeholder-badge.png')) {
                      target.src = '/placeholder-badge.png';
                      target.onerror = null; // Prevent further retries
                    }
                  }}
              />
              {!badge.is_earned && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-gray-400"/>
                  </div>
              )}
              {badge.is_earned && (
                  <div className="absolute -top-2 -right-2">
                    <Award className="w-6 h-6 text-yellow-500"/>
                  </div>
              )}
            </div>
            <h3 className="font-medium text-center text-sm mt-2">{badge.name}</h3>

            {badge.progress > 0 && badge.progress < 100 && (
                <div className="w-full mt-2">
                  <Progress value={badge.progress} className="h-1"/>
                  <p className="text-xs text-center mt-1 text-gray-500">{badge.progress}%</p>
                </div>
            )}
          </Card>
        </motion.div>
      ))}
    </div>
  )
}