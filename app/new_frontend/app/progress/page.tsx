"use client"

import Dashboard from "@/components/dashboard"
import { useAuth } from '@/contexts/auth-context' // <-- Use AuthContext instead of useUser
import { Loader2, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ProgressPage() {
  const { user, loading } = useAuth() // <-- AuthContext works correctly

  console.log('Progress page using AuthContext:', {
    user: user?.username,
    id: user?.id,
    loading
  })

  // If still loading, show loading indicator
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-lg">Loading authentication...</p>
      </div>
    )
  }

  // No user? Show login prompt
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <AlertCircle className="w-12 h-12 text-blue-500 mb-4" />
        <p className="text-lg">Please log in to view your progress.</p>
        <Link
          href="/login"
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Go to Login
        </Link>
      </div>
    )
  }

  // User is authenticated, wrap Dashboard in a div
  return (
    <div className="p-6">
      <Dashboard />
    </div>
  )
}