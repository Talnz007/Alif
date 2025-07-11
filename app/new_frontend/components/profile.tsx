"use client"

import { useRef, useState } from "react"
import { Sparkles, BadgeCheck, Flame, Star, Loader2, AlertTriangle, Pencil, Trash2 } from "lucide-react"
import useProfile from "@/hooks/use-profile"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import useUser from "@/hooks/use-user"
import { getSupabaseClient } from "@/lib/supabase" // <-- Use the getter, not the default client
import { useAuth } from "@/contexts/auth-context"

// --- Brand palette ---
const BRAND_INDIGO = "bg-[#232645] dark:bg-[#232645]"
const BRAND_VIOLET = "bg-[#3d3586] dark:bg-[#3d3586]"
const BRAND_ORANGE = "text-orange-400"
const BRAND_ACCENT = "text-[#A779FF]"
const CARD_SHADOW = "shadow-md"
const ROUND_XL = "rounded-2xl"

const MAX_IMAGE_SIZE = 512 * 1024 // 512KB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"]
const GITHUB_ISSUES_URL = "https://github.com/Talnz007/Alif/issues/new"
const DISCUSSION_CATEGORIES = [
  { slug: "general", label: "General", description: "Chat about anything and everything" },
  { slug: "ideas", label: "Ideas", description: "Share ideas for new features" },
  { slug: "polls", label: "Polls", description: "Take a vote from the community" },
  { slug: "q-a", label: "Q&A", description: "Ask the community for help" },
  { slug: "show-and-tell", label: "Show and Tell", description: "Show off something you've made" }
]
function getDiscussionUrl(slug: string) {
  if (slug === "ideas") {
    return `https://github.com/Talnz007/Alif/discussions/new?category=ideas&title=Feedback%20for%20Alif&body=Describe%20your%20feedback%20or%20suggestions%20here!`
  }
  return `https://github.com/Talnz007/Alif/discussions/new?category=${slug}`
}

type ProfileData = {
  id: string
  username: string
  email: string
  created_at: string
  total_points: number
  badges: { id: string; name: string; description: string; image_url?: string }[]
  streak?: { current_streak: number; longest_streak: number }
  image_url?: string | null
}

export default function Profile() {
  const { profile: rawProfile, loading, error, refetch } = useProfile() as {
    profile: ProfileData | null
    loading: boolean
    error: any
    refetch?: () => void
  }
  const profile: ProfileData | null = rawProfile
  const { user } = useUser()
  const { token } = useAuth()
  console.log('Sending JWT:', token)
  const supabase = getSupabaseClient(token ?? undefined)
  const { theme, setTheme } = useTheme?.() || { theme: "dark", setTheme: () => {} }
  const [selectedCategory, setSelectedCategory] = useState("ideas")
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ========== Profile Photo Upload/Remove ==========
  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploadError(null)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setUploadError("Only JPEG, PNG, or WEBP images are allowed.")
      return
    }
    if (file.size > MAX_IMAGE_SIZE) {
      setUploadError("Image too large (max 512KB).")
      return
    }
    setUploading(true)
    try {
      const ext = file.type.split("/")[1]
      const filePath = `${user.id}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const imageUrl = data.publicUrl
      const { error: dbError } = await supabase
        .from("users")
        .update({ image_url: imageUrl })
        .eq("id", user.id)
      if (dbError) throw dbError
      refetch?.()
    } catch (e: any) {
      setUploadError(e.message || "Upload failed.")
    }
    setUploading(false)
  }

  async function handleDeletePhoto() {
    if (!profile?.image_url) return
    setUploading(true)
    setUploadError(null)
    try {
      const urlParts = (profile.image_url || "").split("/")
      const fileName = urlParts[urlParts.length - 1]
      const filePath = `${user.id}.${fileName.split(".").pop()}` // ensure matching the uploaded file name
      await supabase.storage.from("avatars").remove([filePath])
      await supabase.from("users").update({ image_url: null }).eq("id", user.id)
      refetch?.()
    } catch (e: any) {
      setUploadError(e.message || "Delete failed.")
    }
    setUploading(false)
  }

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-500 mb-2" />
        <span className="text-gray-500 dark:text-gray-300">Loading your profile...</span>
      </div>
    )
  }
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px]">
        <AlertTriangle className="w-8 h-8 text-orange-500 mb-2" />
        <span className="text-gray-700 dark:text-gray-200">Could not load profile. Please try again.</span>
      </div>
    )
  }

  return (
    <div className="max-w-[1280px] mx-auto p-4 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
      {/* --- Left: User Info & Stats --- */}
      <div className="col-span-1 flex flex-col items-center md:items-start gap-8">
        {/* --- Profile image section --- */}
        <div className="flex flex-col items-center gap-2">
          <div className={`relative w-28 h-28 ${ROUND_XL} border-4 border-indigo-400 overflow-hidden ${CARD_SHADOW} bg-gray-100 dark:bg-gray-800`}>
            <img
              src={profile.image_url || "/placeholder-profile.png"}
              alt="Profile"
              className="object-cover w-full h-full"
            />
            <button
              type="button"
              className="absolute bottom-2 right-2 bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow-md"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              title="Edit Photo"
              aria-label="Edit photo"
            >
              <Pencil className="w-5 h-5 text-indigo-500" />
            </button>
            {profile.image_url && (
              <button
                type="button"
                className="absolute top-2 right-2 bg-white/80 dark:bg-gray-900/80 rounded-full p-1 shadow-md"
                disabled={uploading}
                onClick={handleDeletePhoto}
                title="Delete Photo"
                aria-label="Delete photo"
              >
                <Trash2 className="w-5 h-5 text-red-500" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleImageUpload}
              disabled={uploading}
            />
          </div>
          {uploadError && <span className="text-xs text-red-400">{uploadError}</span>}
          {uploading && <Loader2 className="animate-spin w-4 h-4 text-indigo-500" />}
        </div>
        {/* --- User info and stats --- */}
        <div className="text-center md:text-left">
          <h2 className={`text-2xl md:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white`}>
            {profile.username} <Sparkles className={BRAND_ORANGE + " w-5 h-5"} />
          </h2>
          <p className="text-gray-900 dark:text-gray-300 text-sm">{profile.email}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Joined: {new Date(profile.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex flex-col gap-2 w-full">
          <div className={`flex items-center gap-2 ${BRAND_INDIGO} ${ROUND_XL} px-6 py-3 ${CARD_SHADOW}`}>
            <Flame className="text-orange-500" />
            <span className="font-semibold text-gray-200 dark:text-gray-200 text-sm md:text-base">Streak:</span>
            <span className="text-gray-200 dark:text-gray-200">{profile.streak?.current_streak ?? 0} days</span>
            <span className="ml-auto text-xs text-gray-400">Longest: {profile.streak?.longest_streak ?? 0}</span>
          </div>
          <div className={`flex items-center gap-2 ${BRAND_INDIGO} ${ROUND_XL} px-6 py-3 ${CARD_SHADOW}`}>
            <Star className="text-indigo-500" />
            <span className="font-semibold text-gray-200 dark:text-gray-200 text-sm md:text-base">Points:</span>
            <span className="text-gray-200 dark:text-gray-200">{profile.total_points}</span>
          </div>
          <div className={`flex items-center gap-2 ${BRAND_INDIGO} ${ROUND_XL} px-6 py-3 ${CARD_SHADOW}`}>
            <BadgeCheck className="text-green-500" />
            <span className="font-semibold text-gray-200 dark:text-gray-200 text-sm md:text-base">Badges:</span>
            <span className="text-gray-200 dark:text-gray-200">{profile.badges.length}</span>
          </div>
        </div>
        {/* Theme toggle */}
        <div className="mt-4 w-full flex justify-center md:justify-start">
          <Button
            variant="outline"
            className="rounded-full border-2 border-indigo-400 dark:border-indigo-600 shadow px-6 py-2 font-semibold transition-transform duration-300 hover:scale-105 hover:shadow-lg text-gray-900 dark:text-white"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </Button>
        </div>
      </div>

      {/* --- Middle: Badges --- */}
      <div className="col-span-1 flex flex-col gap-4">
        <h3 className={`text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2`}>
          <BadgeCheck className="text-green-500" /> Badges Earned
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {profile.badges.length === 0 ? (
            <span className="col-span-3 text-gray-400 text-center">No badges yet. Start learning to earn some!</span>
          ) : (
            profile.badges.slice(0, 6).map((badge) => (
              <div
                key={badge.id}
                className={`flex flex-col items-center ${BRAND_INDIGO} ${ROUND_XL} shadow p-2 border border-indigo-100 dark:border-gray-800 hover:shadow-lg transition`}
                title={badge.description}
              >
                <img
                  src={badge.image_url || "/placeholder-badge.png"}
                  alt={badge.name}
                  className="w-12 h-12 object-contain mb-1 drop-shadow-[0_0_6px_rgba(99,102,241,0.3)]"
                />
                <span className="text-xs text-gray-200 text-center font-medium">
                  {badge.name}
                </span>
              </div>
            ))
          )}
        </div>
        {profile.badges.length > 6 && (
          <span className="text-xs text-indigo-400 cursor-pointer mt-2">View all badges</span>
        )}
      </div>

      {/* --- Right: Settings & Support --- */}
      <div className="col-span-1 flex flex-col gap-4">
        <div className={`mt-6 ${BRAND_VIOLET} ${ROUND_XL} p-6 flex flex-col gap-4 ${CARD_SHADOW}`}>
          <span className="font-semibold text-indigo-100 dark:text-indigo-100 text-lg">Settings & Support</span>
          <Button
            variant="ghost"
            className="justify-start text-indigo-200 hover:text-gray-900 dark:text-white focus:text-indigo-400 transition"
            aria-label="Help"
            onClick={() => window.open(GITHUB_ISSUES_URL, "_blank")}
          >
            Need help?
          </Button>
          {/* Dropdown for discussion categories */}
          <div className="flex flex-col gap-2">
            <label htmlFor="discussion-category" className="text-sm text-indigo-100 dark:text-indigo-100 font-medium">
              Send feedback, ask, or share:
            </label>
            <select
              id="discussion-category"
              className={`${ROUND_XL} py-2 px-4 bg-[#232645] text-indigo-100 dark:text-indigo-100 border-0 focus:ring-2 focus:ring-indigo-400 shadow-inner font-medium transition duration-200`}
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              style={{ maxWidth: 280 }}
              aria-label="Select feedback category"
            >
              {DISCUSSION_CATEGORIES.map(cat => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.label} — {cat.description}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              className="justify-start text-orange-300 hover:text-orange-100 focus:text-orange-400 transition px-0 font-semibold"
              aria-label="Send Feedback"
              style={{ alignSelf: 'flex-start' }}
              onClick={() => window.open(getDiscussionUrl(selectedCategory), "_blank")}
            >
              Start discussion in "{DISCUSSION_CATEGORIES.find(cat => cat.slug === selectedCategory)?.label}"
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}