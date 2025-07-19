import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import debounce from 'lodash/debounce'; // Install lodash if not present

export function useBadgeCheck(userId: string | null) {
  const [lastCheckTime, setLastCheckTime] = useState<number>(0);
  const [isChecking, setIsChecking] = useState(false);
  const checkInterval = 5 * 60 * 1000; // 5 minutes between checks
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { token } = useAuth(); // Get token

  // Debounced checkBadges function
  const checkBadges = debounce(async () => {
    if (!userId || isChecking) return;

    const now = Date.now();
    if (now - lastCheckTime < checkInterval) return;

    try {
      setIsChecking(true);
      const response = await fetch(`/api/badges/check-new?userId=${userId}`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error('Failed to check badges');
      setLastCheckTime(now);
      localStorage.setItem('last_badge_check', now.toString());
    } catch (error) {
      console.error('Error checking badges:', error);
    } finally {
      setIsChecking(false);
    }
  }, 1000); // 1-second debounce

  useEffect(() => {
    const storedLastCheck = localStorage.getItem('last_badge_check');
    if (storedLastCheck) {
      setLastCheckTime(parseInt(storedLastCheck));
    }

    if (userId) {
      checkBadges();
    }

    // Clear interval on unmount or userId change
    return () => {
      checkBadges.cancel(); // Cancel any pending debounced calls
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [userId, token, checkBadges]); // Include checkBadges in deps

  return { checkBadges, isChecking };
}