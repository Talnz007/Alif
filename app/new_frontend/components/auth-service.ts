// This is a mock authentication service that would be replaced with actual backend integration
// such as Supabase, Auth.js, or Firebase in a production environment

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
}

export interface AuthResponse {
  success: boolean
  user?: User
  error?: string
}

// Mock user data
const MOCK_USERS: User[] = [
  {
    id: "1",
    name: "Demo User",
    email: "demo@example.com",
    avatar: "/placeholder.svg?height=100&width=100",
  },
]

// Simulate authentication delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const authService = {
  // Email/password login
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay(1500) // Simulate network request

    // In a real app, this would validate credentials against a backend
    if (email && password) {
      const user = MOCK_USERS.find((u) => u.email === email)

      if (user) {
        // Store auth state in localStorage (in a real app, use secure cookies or tokens)
        localStorage.setItem("alif_user", JSON.stringify(user))
        return { success: true, user }
      }
    }

    return { success: false, error: "Invalid credentials" }
  },

  // Social login
  async socialLogin(provider: "google" | "facebook"): Promise<AuthResponse> {
    await delay(1500) // Simulate network request

    // In a real app, this would redirect to OAuth flow
    // For demo purposes, we'll just return a success
    const user = MOCK_USERS[0]
    localStorage.setItem("alif_user", JSON.stringify(user))

    return { success: true, user }
  },

  // Sign up
  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    await delay(1500) // Simulate network request

    // In a real app, this would create a new user in the database
    if (name && email && password) {
      const newUser: User = {
        id: `user_${Date.now()}`,
        name,
        email,
        avatar: "/placeholder.svg?height=100&width=100",
      }

      localStorage.setItem("alif_user", JSON.stringify(newUser))
      return { success: true, user: newUser }
    }

    return { success: false, error: "Invalid user data" }
  },

  // Logout
  async logout(): Promise<void> {
    await delay(500) // Simulate network request
    localStorage.removeItem("alif_user")
  },

  // Get current user
  getCurrentUser(): User | null {
    if (typeof window === "undefined") return null

    const userJson = localStorage.getItem("alif_user")
    if (userJson) {
      try {
        return JSON.parse(userJson) as User
      } catch (e) {
        return null
      }
    }
    return null
  },
}
