"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { UserActivity } from '@/lib/user-activity';


// Define the user profile structure based on UserResponse schema
export interface UserProfile {
  id?: string        // Add UUID field
  username: string
  email: string
  access_token?: string
  avatar_url?: string
  full_name?: string
}

// Define the auth context interface
interface AuthContextType {
  user: UserProfile | null
  loading: boolean
  signIn: (username: string, password: string) => Promise<{ success: boolean; message: string }>
  signUp: (username: string, email: string, password: string) => Promise<{ success: boolean; message: string }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ success: boolean; message: string }>
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ success: false, message: 'Not implemented' }),
  signUp: async () => ({ success: false, message: 'Not implemented' }),
  signOut: async () => {},
  updateProfile: async () => ({ success: false, message: 'Not implemented' }),
})

// Helper to set auth cookie for middleware detection
function setAuthCookie(isAuthenticated: boolean) {
  if (isAuthenticated) {
    // Set a cookie for middleware to detect auth state
    document.cookie = "auth_state=true; path=/; max-age=604800; SameSite=Strict";
  } else {
    // Clear the cookie
    document.cookie = "auth_state=; path=/; max-age=0; SameSite=Strict";
  }
}

// Auth Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true)

      try {
        // Check if we have user data in localStorage
        const token = localStorage.getItem('access_token')
        const username = localStorage.getItem('username')
        const email = localStorage.getItem('email')
        const userId = localStorage.getItem('user_id') // New: retrieve user ID

        if (token && username && email) {
          // Verify token is still valid
          try {
            // Set user data including the UUID if available
            setUser({
              id: userId || undefined, // Use UUID if available
              username,
              email,
              access_token: token
            })
            setAuthCookie(true)

            // If we don't have a UUID yet, fetch it from the server
            if (!userId && username) {
              fetchAndStoreUserId(username, token)
            }
          } catch (error) {
            console.error('Error checking auth state:', error)
            // On error, assume token is invalid
            localStorage.removeItem('access_token')
            localStorage.removeItem('username')
            localStorage.removeItem('email')
            localStorage.removeItem('user_id') // Also remove user_id
            setAuthCookie(false)
          }
        } else {
          // No token found
          setAuthCookie(false)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        setAuthCookie(false)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Function to fetch and store user ID
  const fetchAndStoreUserId = async (username: string, token: string) => {
  try {
    // Try using username first
    let response = await fetch(`/api/users/lookup?username=${encodeURIComponent(username)}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // If that fails, try with email
    if (!response.ok) {
      const email = localStorage.getItem('email');
      if (email) {
        console.log('Username lookup failed, trying with email');
        response = await fetch(`/api/users/lookup?username=${encodeURIComponent(email)}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    }

    if (response.ok) {
      const data = await response.json();
      if (data.id) {
        // Store the UUID in localStorage
        localStorage.setItem('user_id', data.id);

        // Update the user state
        setUser(prevUser => prevUser ? {
          ...prevUser,
          id: data.id
        } : null);

        console.log('User ID fetched and stored:', data.id);
      }
    } else {
      console.error('Failed to fetch user ID:', await response.text());
    }
  } catch (error) {
    console.error('Error fetching user ID:', error);
  }
}

  // Sign in function
  const signIn = async (username: string, password: string) => {
    setLoading(true)

    try {
      // Create form data as required by your API
      const formData = new FormData()
      formData.append('username', username)
      formData.append('password', password)

      // Use the Next.js API route
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Invalid username or password'
        }
      }

      await UserActivity.login();

      // Store auth data
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('username', data.username)
      localStorage.setItem('email', data.email)

      // New: If the response includes a UUID, store it
      if (data.id) {
        localStorage.setItem('user_id', data.id)
      }

      // Update user state
      setUser({
        id: data.id, // Include UUID if available
        username: data.username,
        email: data.email,
        access_token: data.access_token
      })

      // Set auth cookie for middleware
      setAuthCookie(true)

      // If we don't have a UUID in the response, fetch it
      if (!data.id) {
        fetchAndStoreUserId(data.username, data.access_token)
      }

      return { success: true, message: 'Signed in successfully' }
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        success: false,
        message: 'Connection error. Please try again later.'
      }
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
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          email,
          password
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return {
          success: false,
          message: data.error || 'Registration failed'
        }
      }
      // For waitlist mode, we'll register the user but NOT log them in
      // Comment out the following section:
      /*
      // Store auth data
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('username', data.username)
      localStorage.setItem('email', data.email)

      // New: If the response includes a UUID, store it
      if (data.id) {
        localStorage.setItem('user_id', data.id)
      }

      // Update user state
      setUser({
        id: data.id, // Include UUID if available
        username: data.username,
        email: data.email,
        access_token: data.access_token
      })

      // Set auth cookie for middleware
      setAuthCookie(true)

      // If we don't have a UUID in the response, fetch it
      if (!data.id) {
        fetchAndStoreUserId(data.username, data.access_token)
      }
      */
      toast({
        title: 'Account created!',
        description: 'Welcome to Alif! Start your learning journey now.'
      })

      return { success: true, message: 'Signed up successfully' }
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        success: false,
        message: 'Connection error. Please try again later.'
      }
    } finally {
      setLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      // Clear localStorage
      localStorage.removeItem('access_token')
      localStorage.removeItem('username')
      localStorage.removeItem('email')
      localStorage.removeItem('user_id') // New: clear user_id too

      // Clear user state
      setUser(null)

      // Clear auth cookie
      setAuthCookie(false)

      // Redirect to login page
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
      // Just update local state for now
      setUser({ ...user, ...updates })

      // Update localStorage if certain fields change
      if (updates.username) {
        localStorage.setItem('username', updates.username)
      }
      if (updates.email) {
        localStorage.setItem('email', updates.email)
      }
      if (updates.id) {
        localStorage.setItem('user_id', updates.id)
      }

      return { success: true, message: 'Profile updated' }
    } catch (error) {
      console.error('Update profile error:', error)
      return {
        success: false,
        message: 'Failed to update profile'
      }
    }
  }

  // Context value
  const value = {
    user,
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