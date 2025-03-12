"use client"

import { useState, useEffect } from 'react'

export interface LeaderboardEntry {
  id: string
  username: string
  points: number
  rank: number
  avatar_url?: string | null
  isFriend?: boolean
  isLocal?: boolean
}

export function useLeaderboard(
  type: 'global' | 'local' | 'friends' = 'global'
) {
  const [data, setData] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/leaderboard?type=${type}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch ${type} leaderboard: ${response.status}`)
        }

        const result = await response.json()

        if (!Array.isArray(result)) {
          console.error('Expected array response but got:', result)
          setData([])
          return
        }

        setData(result)
      } catch (err) {
        console.error('Error fetching leaderboard:', err)
        setError(err instanceof Error ? err : new Error(String(err)))

        // Provide fallback data if needed
        setData([])
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [type])

  return {
    data,
    isLoading,
    error,
    isEmpty: data.length === 0
  }
}