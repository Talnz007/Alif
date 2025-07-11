"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { UserActivity } from '@/lib/user-activity';

// User profile structure
export interface UserProfile {
  id?: string
  username: string
  email: string
  access_token?: string
  avatar_url?: string
  full_name?: string
}

// Auth context interface
interface AuthContextType {
  user: UserProfile | null
  token: string | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ success: boolean; message: string }>
  signUp: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>
}

// Context default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  signIn: async () => ({ success: false, message: 'Not implemented' }),
  signUp: async () => ({ success: false, message: 'Not implemented' }),
  signOut: async () => {},
  updateProfile: async () => ({ success: false, message: 'Not implemented' }),
})

// Helper for auth cookie (middleware detection)
function setAuthCookie(isAuthenticated: boolean) {
  if (isAuthenticated) {
    document.cookie = "auth_state=true; path=/; max-age=604800; SameSite=Strict";
  } else {
    document.cookie = "auth_state=; path=/; max-age=0; SameSite=Strict";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // On mount: check auth state from localStorage
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)
      try {
        const accessToken = localStorage.getItem('access_token')
        const username = localStorage.getItem('username')
        const email = localStorage.getItem('email')
        const userId = localStorage.getItem('user_id')
        if (accessToken && username && email) {
          setToken(accessToken)
          setUser({
            id: userId || undefined,
            username,
            email,
            access_token: accessToken
          })
          setAuthCookie(true)
          // Optionally re-fetch userId if missing
          if (!userId && username) {
            await fetchAndStoreUserId(username, accessToken)
          }
        } else {
          setToken(null)
          setUser(null)
          setAuthCookie(false)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setToken(null)
        setUser(null)
        setAuthCookie(false)
      } finally {
        setLoading(false)
      }
    }
    checkAuth()
    // eslint-disable-next-line
  }, [])

  // Fetch and store userId if missing
  const fetchAndStoreUserId = async (username: string, token: string) => {
    try {
      let response = await fetch(`/api/users/lookup?username=${encodeURIComponent(username)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) {
        const email = localStorage.getItem('email')
        if (email) {
          response = await fetch(`/api/users/lookup?username=${encodeURIComponent(email)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
        }
      }
      if (response.ok) {
        const data = await response.json();
        if (data.id) {
          localStorage.setItem('user_id', data.id)
          setUser(prevUser => prevUser ? { ...prevUser, id: data.id } : null)
        }
      }
    } catch (error) {
      console.error('Error fetching user ID:', error)
    }
  }

  // Sign in function
  const signIn = async (username: string, password: string) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData
      })
      const data = await response.json()
      if (!response.ok) {
        return { success: false, message: data.error || 'Invalid username or password' }
      }
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('username', data.username)
      localStorage.setItem('email', data.email)
      setToken(data.access_token)
      if (data.id) {
        localStorage.setItem('user_id', data.id)
      }
      setUser({
        id: data.id,
        username: data.username,
        email: data.email,
        access_token: data.access_token
      })
      setAuthCookie(true)
      if (!data.id) {
        await fetchAndStoreUserId(data.username, data.access_token)
      }
      try {
        await UserActivity.login();
      } catch (error) {
        console.warn("Failed to log login activity:", error);
      }
      return { success: true, message: 'Signed in successfully' }
    } catch (error) {
      console.error('Sign in error:', error)
      return { success: false, message: 'Connection error. Please try again later.' }
    } finally {
      setLoading(false)
    }
  }

  // Sign up function
  const signUp = async (username: string, email: string, password: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      })
      const data = await response.json()
      if (!response.ok) {
        return { success: false, message: data.error || 'Registration failed' }
      }
      toast({
        title: 'Account created!',
        description: 'Welcome to Alif! Start your learning journey now.'
      })
      return { success: true, message: 'Signed up successfully' }
    } catch (error) {
      console.error('Sign up error:', error)
      return { success: false, message: 'Connection error. Please try again later.' }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      localStorage.removeItem('access_token')
      localStorage.removeItem('username')
      localStorage.removeItem('email')
      localStorage.removeItem('user_id')
      setUser(null)
      setToken(null)
      setAuthCookie(false)
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
      toast({
        title: 'Error',
        description: 'Failed to sign out properly.',
        variant: 'destructive'
      })
    }
  }

  // Update profile function
  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) {
      return { success: false, message: 'Not authenticated' }
    }
    try {
      setUser({ ...user, ...updates })
      if (updates.username) localStorage.setItem('username', updates.username)
      if (updates.email) localStorage.setItem('email', updates.email)
      if (updates.id) localStorage.setItem('user_id', updates.id)
      return { success: true, message: 'Profile updated' }
    } catch (error) {
      console.error('Update profile error:', error)
      return { success: false, message: 'Failed to update profile' }
    }
  }

  // Context value
  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export const useAuth = () => useContext(AuthContext)