"use client"

import { useState, useEffect, useRef } from 'react'
import { useBadgeNotification } from '@/components/ui/badge-notification'
import { useAuth } from '@/contexts/auth-context'

export default function BadgeTracker() {
  const { showBadgeNotification, BadgeNotificationComponent } = useBadgeNotification()
  const [checkingBadges, setCheckingBadges] = useState(false)
  const { user, token } = useAuth()

  const lastCheckRef = useRef<number>(Date.now())
  const CHECK_INTERVAL = 15 * 60 * 1000

  useEffect(() => {
    if (!user?.id) return

    const checkNewBadges = async () => {
      if (checkingBadges) return

      const now = Date.now()
      if (now - lastCheckRef.current < CHECK_INTERVAL) {
        console.log('Skipping badge check - checked recently')
        return
      }

      try {
        setCheckingBadges(true)
        console.log('Checking for new badges...')
        lastCheckRef.current = now

        const response = await fetch(`/api/badges/check-new?userId=${user.id || localStorage.getItem('user_id')}`, {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          }
        });

        if (!response.ok) {
          console.error('Error checking for new badges:', response.status)
          return
        }

        const data = await response.json()

        if (data.newBadges && data.newBadges.length > 0) {
          console.log(`Found ${data.newBadges.length} new badges to display`)

          localStorage.setItem(
            'pendingBadges',
            JSON.stringify(data.newBadges)
          )

          showBadgeNotification(data.newBadges[0])

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

    checkPendingBadges()

    const initialCheck = setTimeout(() => {
      if (Date.now() - lastCheckRef.current >= CHECK_INTERVAL) {
        checkNewBadges()
      }
    }, 3000)

    const badgeInterval = setInterval(checkNewBadges, CHECK_INTERVAL)
    
    return () => {
      clearTimeout(initialCheck)
      clearInterval(badgeInterval)
    }
  }, [user, token, showBadgeNotification, checkingBadges])
  
  return BadgeNotificationComponent
}