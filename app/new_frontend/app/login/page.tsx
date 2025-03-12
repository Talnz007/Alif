"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function Login() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { signIn, loading: authLoading } = useAuth()
  const { toast } = useToast()

  // Get the redirect path (if any)
  const from = searchParams?.get('from') || '/study-assistant'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Prevent submitting while already in progress
    if (isSubmitting || authLoading) return

    setError(null)
    setIsSubmitting(true)

    try {
      const result = await signIn(username, password)

      if (result.success) {
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in."
        })

        // Use setTimeout to give the auth state time to update
        setTimeout(() => {
          router.push(from)
        }, 100)
      } else {
        setError(result.message)
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Combined loading state from form submission and auth context
  const isLoading = isSubmitting || authLoading

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 flex flex-col items-center">
          <div className="h-16 w-16 mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">A</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Login to your Alif account
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm rounded">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  href="/register"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Create account
                </Link>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}