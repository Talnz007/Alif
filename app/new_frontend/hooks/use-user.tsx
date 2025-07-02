"use client"

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { useAuth } from '@/contexts/auth-context'

// Define the type for our user state
interface UserState {
  user: any;
  loading: boolean;
  error: any;
}

// Create a context for the user state
const UserContext = createContext<UserState | undefined>(undefined);

// Create the provider component
export function UserProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth() // Use the working AuthContext
  const [state, setState] = useState<UserState>({
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

  return (
    <UserContext.Provider value={state}>
      {children}
    </UserContext.Provider>
  );
}

// Create a wrapper around useAuth that ensures it doesn't get stuck
export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

export default useUser;