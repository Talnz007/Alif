"use client"

import { useState, useEffect, useRef } from 'react'
import { useBadgeNotification } from '@/components/ui/badge-notification'
import { useAuth } from '@/contexts/auth-context'

export default function BadgeTracker() {
  const { showBadgeNotification, BadgeNotificationComponent } = useBadgeNotification()
  const [checkingBadges, setCheckingBadges] = useState(false)
  const { user } = useAuth()

  // Add a ref to track last check time
  const lastCheckRef = useRef<number>(Date.now())
  // Minimum interval between checks (15 minutes = 15 * 60 * 1000 ms)
  const CHECK_INTERVAL = 15 * 60 * 1000

  useEffect(() => {
    if (!user?.id) return

    // Check for new badges
    const checkNewBadges = async () => {
      if (checkingBadges) return

      // IMPORTANT: Check if enough time has passed since last check
      const now = Date.now()
      if (now - lastCheckRef.current < CHECK_INTERVAL) {
        console.log('Skipping badge check - checked recently')
        return
      }

      try {
        setCheckingBadges(true)
        console.log('Checking for new badges...')
        lastCheckRef.current = now // Update last check time

        const response = await fetch(`/api/badges/check-new?userId=${user.id || localStorage.getItem('user_id')}`)

        if (!response.ok) {
          console.error('Error checking for new badges:', response.status)
          return
        }

        const data = await response.json()

        if (data.newBadges && data.newBadges.length > 0) {
          console.log(`Found ${data.newBadges.length} new badges to display`)

          // Store badges to show
          localStorage.setItem(
            'pendingBadges',
            JSON.stringify(data.newBadges)
          )

          // Show the first badge
          showBadgeNotification(data.newBadges[0])

          // Store the rest for later
          if (data.newBadges.length > 1) {
            localStorage.setItem(
              'pendingBadges',
              JSON.stringify(data.newBadges.slice(1))
            )
          } else {
            localStorage.removeItem('pendingBadges')
          }
        }
      } catch (error) {
        console.error('Error checking for new badges:', error)
      } finally {
        setCheckingBadges(false)
      }
    }

    // Check for pending badges from previous sessions
    const checkPendingBadges = () => {
      const pendingBadges = localStorage.getItem('pendingBadges')
      if (!pendingBadges) return

      try {
        const badges = JSON.parse(pendingBadges)
        if (badges.length > 0) {
          showBadgeNotification(badges[0])

          if (badges.length > 1) {
            localStorage.setItem('pendingBadges', JSON.stringify(badges.slice(1)))
          } else {
            localStorage.removeItem('pendingBadges')
          }
        }
      } catch (error) {
        console.error('Error processing pending badges:', error)
        localStorage.removeItem('pendingBadges')
      }
    }

    // Check for pending badges when component mounts
    checkPendingBadges()

    // Initial check for new badges after 3 seconds
    const initialCheck = setTimeout(() => {
      // Only do initial check if we haven't checked in the last interval
      if (Date.now() - lastCheckRef.current >= CHECK_INTERVAL) {
        checkNewBadges()
      }
    }, 3000)

    // Check periodically but much less frequently (15 minutes)
    const badgeInterval = setInterval(checkNewBadges, CHECK_INTERVAL)
    
    return () => {
      clearTimeout(initialCheck)
      clearInterval(badgeInterval)
    }
  }, [user, showBadgeNotification, checkingBadges])
  
  return BadgeNotificationComponent
}