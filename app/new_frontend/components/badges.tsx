"use client";

import { Award, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getUserBadges } from "@/lib/api/progress-service";

interface Badge {
  id: number;
  name: string;
  description: string;
  image_url: string;
  category: string;
  is_earned: boolean;
  progress: number;
  earned_at?: string;
}

interface BadgesProps {
  userId: string;
  showAll?: boolean; // Option to show all badges or just earned ones
}

export default function Badges({ userId, showAll = false }: BadgesProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBadges() {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost:8000/api/v1/badges?userId=${userId}${showAll ? '&showAll=true' : ''}`);
        if (!response.ok) throw new Error('Failed to fetch badges');
        const data = await response.json();
        setBadges(data);
      } catch (err) {
        console.error('Error fetching badges:', err);
        setError('Failed to load badges');
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, [userId, showAll]);

  if (loading) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
          <Award className="mr-2" /> My Badges
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse">
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
          <Award className="mr-2" /> My Badges
        </h2>
        <div className="text-center text-red-500">{error}</div>
      </div>
    );
  }

  if (!showAll && badges.length === 0) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
          <Award className="mr-2" /> My Badges
        </h2>
        <div className="text-center py-8">
          <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            No badges earned yet. Complete activities to earn your first badge!
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow"
    >
      <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-800 dark:text-white">
        <Award className="mr-2" /> 
        {showAll ? 'All Badges' : 'My Badges'} 
        {!showAll && <span className="ml-2 text-sm font-normal">({badges.length} earned)</span>}
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge, index) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className={`p-4 rounded-lg transition-all hover:shadow-md ${
              badge.is_earned 
                ? "bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700" 
                : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 opacity-60"
            }`}
          >
            <div className="flex items-start mb-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mr-3 ${
                badge.is_earned ? 'bg-blue-100 dark:bg-blue-800' : 'bg-gray-200 dark:bg-gray-600'
              }`}>
                {badge.is_earned ? (
                  <img 
                    src={badge.image_url || '/badges/default.png'} 
                    alt={badge.name}
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/badges/default.png';
                    }}
                  />
                ) : (
                  <Lock className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-1">
                  {badge.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {badge.description}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              {badge.is_earned ? (
                <div className="flex items-center text-green-600 dark:text-green-400">
                  <Award className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">Earned</span>
                </div>
              ) : (
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Lock className="w-4 h-4 mr-1" />
                  <span className="text-sm">Not earned</span>
                </div>
              )}
              
              {badge.earned_at && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(badge.earned_at).toLocaleDateString()}
                </span>
              )}
            </div>
            
            {!badge.is_earned && badge.progress > 0 && (
              <div className="mt-3">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>{badge.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${badge.progress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}