import { useState, useEffect, useRef } from 'react'

// Custom hook that prevents excessive badge checking
export function useBadgeCheck(userId: string | null) {
  const [lastCheckTime, setLastCheckTime] = useState<number>(0)
  const [isChecking, setIsChecking] = useState(false)
  const checkInterval = 5 * 60 * 1000 // 5 minutes between checks
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  const checkBadges = async () => {
    if (!userId || isChecking) return
    
    const now = Date.now()
    // Only check if enough time has passed since last check
    if (now - lastCheckTime < checkInterval) return
    
    try {
      setIsChecking(true)
      const response = await fetch(`/api/badges/check-new?userId=${userId}`)
      setLastCheckTime(now)
      
      // Store last check time in localStorage to persist between page refreshes
      localStorage.setItem('last_badge_check', now.toString())
    } catch (error) {
      console.error('Error checking badges:', error)
    } finally {
      setIsChecking(false)
    }
  }
  
  useEffect(() => {
    // Initialize last check time from localStorage
    const storedLastCheck = localStorage.getItem('last_badge_check')
    if (storedLastCheck) {
      setLastCheckTime(parseInt(storedLastCheck))
    }
    
    // Check badges once when component mounts
    if (userId) {
      checkBadges()
    }
    
    // Set up interval for periodic checks (but not too frequent)
    timerRef.current = setInterval(() => {
      if (userId) {
        checkBadges()
      }
    }, checkInterval)
    
    // Clean up interval on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [userId])
  
  return { checkBadges, isChecking }
}