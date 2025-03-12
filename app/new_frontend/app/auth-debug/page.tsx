"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { useUser } from '@/hooks/use-user'
import { Loader2 } from 'lucide-react'

export default function AuthDebugPage() {
  const [startTime] = useState(Date.now())
  const [currentTime, setCurrentTime] = useState(Date.now())

  // Get auth state from both hooks to compare
  const authContext = useAuth()
  const userHook = useUser()

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now())
    }, 100)

    return () => clearInterval(interval)
  }, [])

  const elapsedTime = (currentTime - startTime) / 1000

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debugging</h1>
      <p className="text-sm text-gray-500 mb-6">
        Time elapsed: {elapsedTime.toFixed(1)} seconds
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-2">AuthContext (useAuth)</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">Loading:</span>
            <span>{authContext.loading ? 'true' : 'false'}</span>
            {authContext.loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <div className="mb-2">
            <span className="font-medium">User:</span>
            <span>{authContext.user ? 'Authenticated' : 'Not authenticated'}</span>
          </div>
          {authContext.user && (
            <pre className="bg-white dark:bg-gray-900 p-2 rounded overflow-auto text-xs">
              {JSON.stringify(authContext.user, null, 2)}
            </pre>
          )}
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h2 className="text-lg font-medium mb-2">useUser Hook</h2>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium">Loading:</span>
            <span>{userHook.loading ? 'true' : 'false'}</span>
            {userHook.loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          <div className="mb-2">
            <span className="font-medium">User:</span>
            <span>{userHook.user ? 'Authenticated' : 'Not authenticated'}</span>
          </div>
          {userHook.user && (
            <pre className="bg-white dark:bg-gray-900 p-2 rounded overflow-auto text-xs">
              {JSON.stringify(userHook.user, null, 2)}
            </pre>
          )}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
        <h2 className="text-lg font-medium mb-2">Local Storage</h2>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <span className="font-medium">access_token:</span>
          <span>{typeof window !== 'undefined' ? (localStorage.getItem('access_token') ? '✅ Present' : '❌ Missing') : 'Loading...'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <span className="font-medium">username:</span>
          <span>{typeof window !== 'undefined' ? (localStorage.getItem('username') || '❌ Missing') : 'Loading...'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <span className="font-medium">user_id:</span>
          <span>{typeof window !== 'undefined' ? (localStorage.getItem('user_id') || '❌ Missing') : 'Loading...'}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <span className="font-medium">email:</span>
          <span>{typeof window !== 'undefined' ? (localStorage.getItem('email') || '❌ Missing') : 'Loading...'}</span>
        </div>
      </div>

      <div className="flex space-x-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </button>
        <button
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          onClick={() => {
            localStorage.removeItem('_debug_visited');
            window.location.reload();
          }}
        >
          Clear Debug Flag
        </button>
      </div>
    </div>
  )
}