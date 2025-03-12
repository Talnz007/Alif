"use client"

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/auth-context'

// Create a wrapper around useAuth that ensures it doesn't get stuck
export function useUser() {
  const { user, loading } = useAuth() // Use the working AuthContext
  const [state, setState] = useState({
    user,
    loading: loading || !user, // Initially loading if AuthContext is loading or no user yet
    error: null
  })

  // Use effect to update state from AuthContext
  useEffect(() => {
    console.log('useUser effect running with:', { contextUser: !!user, contextLoading: loading })

    // If AuthContext has loaded and returned a user, update our state
    if (!loading) {
      setState({
        user,
        loading: false,
        error: null
      })
    }
  }, [user, loading])

  // Safety fallback: Force loading state to end after 5 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (state.loading) {
        console.warn('useUser forcing end to loading state after timeout')
        setState(prevState => ({
          ...prevState,
          loading: false
        }))
      }
    }, 5000)

    return () => clearTimeout(timeout)
  }, [state.loading])

  return state
}