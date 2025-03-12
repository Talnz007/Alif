"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award } from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'

interface BadgeNotificationProps {
  onClose: () => void
  badge: {
    name: string
    image_url: string
    description: string
  }
}

export function BadgeNotification({ badge, onClose }: BadgeNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 6000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -50 }}
        className="fixed top-4 inset-x-0 mx-auto z-50 w-80"
      >
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 flex gap-4 items-center">
            <div className="relative">
              <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                <img 
                  src={badge.image_url} 
                  alt={badge.name}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder-badge.png'
                  }}
                />
              </div>
              <div className="absolute -top-1 -right-1">
                <Award className="w-5 h-5 text-yellow-300" />
              </div>
            </div>
            <div className="flex-1 text-white">
              <h3 className="font-semibold">Badge Unlocked!</h3>
              <p className="text-sm text-white/80">{badge.name}</p>
            </div>
            <button 
              onClick={onClose}
              className="w-6 h-6 text-white/60 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="bg-white/10 px-4 py-2 text-xs text-white/80">
            {badge.description}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export function useBadgeNotification() {
  const [newBadge, setNewBadge] = useState<any>(null);
  const { toast } = useToast();
  
  function showBadgeNotification(badge: any) {
    setNewBadge(badge);
    
    toast({
      title: "🎉 Badge Unlocked!",
      description: `You've earned the "${badge.name}" badge!`,
    });
  }
  
  function hideBadgeNotification() {
    setNewBadge(null);
  }
  
  return {
    newBadge,
    showBadgeNotification,
    hideBadgeNotification,
    BadgeNotificationComponent: newBadge ? (
      <BadgeNotification badge={newBadge} onClose={hideBadgeNotification} />
    ) : null
  };
}