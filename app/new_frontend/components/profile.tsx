"use client"

import { User, Sparkles, BadgeCheck, Flame, Star, Loader2, AlertTriangle } from "lucide-react";
import useProfile from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import useUser from "@/hooks/use-user";
import { supabase } from "@/lib/supabase";

export default function Profile() {
  const { profile, loading, error } = useProfile();
  const { user } = useUser();
  const { theme, setTheme } = useTheme?.() || { theme: "dark", setTheme: () => {} };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-500 mb-2" />
        <span className="text-gray-500 dark:text-gray-300">Loading your profile...</span>
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <AlertTriangle className="w-8 h-8 text-orange-500 mb-2" />
        <span className="text-gray-700 dark:text-gray-200">Could not load profile. Please try again.</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* Left: User Info & Stats */}
      <div className="col-span-1 flex flex-col items-center md:items-start gap-6">
        {/* Profile image functionality removed */}
        <div className="text-center md:text-left">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {profile.username} <Sparkles className="text-orange-400 w-5 h-5" />
          </h2>
          <p className="text-gray-500 dark:text-gray-300 text-sm">{profile.email}</p>
          <p className="text-xs text-gray-400 mt-1">Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-md">
            <Flame className="text-orange-500" />
            <span className="font-semibold">Streak:</span>
            <span>{profile.streak?.current_streak ?? 0} days</span>
            <span className="ml-auto text-xs text-gray-400">Longest: {profile.streak?.longest_streak ?? 0}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-md">
            <Star className="text-indigo-500" />
            <span className="font-semibold">Points:</span>
            <span>{profile.total_points}</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-2 shadow-md">
            <BadgeCheck className="text-green-500" />
            <span className="font-semibold">Badges:</span>
            <span>{profile.badges.length}</span>
          </div>
        </div>
        {/* Theme toggle */}
        <div className="mt-4 w-full flex justify-center md:justify-start">
          <Button
            variant="outline"
            className="rounded-full border-2 border-indigo-400 dark:border-indigo-600 shadow"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </Button>
        </div>
      </div>

      {/* Middle: Badges */}
      <div className="col-span-1 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <BadgeCheck className="text-green-500" /> Badges Earned
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {profile.badges.length === 0 ? (
            <span className="col-span-3 text-gray-400 text-center">No badges yet. Start learning to earn some!</span>
          ) : (
            profile.badges.slice(0, 6).map((badge) => (
              <div
                key={badge.id}
                className="flex flex-col items-center bg-white dark:bg-gray-900 rounded-xl shadow p-2 border border-indigo-100 dark:border-gray-800 hover:shadow-lg transition"
                title={badge.description}
              >
                <img
                  src={badge.image_url || "/placeholder-badge.png"}
                  alt={badge.name}
                  className="w-12 h-12 object-contain mb-1 drop-shadow-[0_0_6px_rgba(99,102,241,0.3)]"
                />
                <span className="text-xs text-gray-700 dark:text-gray-200 text-center font-medium">
                  {badge.name}
              </span>
          </div>
            ))
          )}
        </div>
        {profile.badges.length > 6 && (
          <span className="text-xs text-indigo-500 cursor-pointer mt-2">View all badges</span>
        )}
      </div>

      {/* Right: Settings & Support (no activity feed) */}
      <div className="col-span-1 flex flex-col gap-4">
        {/* Removed Recent Activity section */}
        {/* Settings & Feedback (stub) */}
        <div className="mt-6 bg-indigo-50 dark:bg-indigo-900 rounded-2xl p-4 flex flex-col gap-2 shadow">
          <span className="font-semibold text-indigo-700 dark:text-indigo-200">Settings & Support</span>
          <Button variant="ghost" className="justify-start text-indigo-600 dark:text-indigo-200" aria-label="Help">
            Need help?
          </Button>
          <Button variant="ghost" className="justify-start text-orange-600 dark:text-orange-200" aria-label="Feedback">
            Send feedback
          </Button>
        </div>
      </div>
    </div>
  );
}

