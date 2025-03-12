"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"

export default function Register() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { signUp, loading: authLoading } = useAuth()
  const { toast } = useToast()

  // Validation functions based on API schema
  const validateUsername = (value: string) => {
    if (value.length < 3) return "Username must be at least 3 characters long";
    if (value.length > 50) return "Username cannot exceed 50 characters";
    return null;
  };

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return null;
  };

  const validatePassword = (value: string) => {
    if (value.length < 8) return "Password must be at least 8 characters long";
    return null;
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Prevent submitting while already in progress
    if (isSubmitting || authLoading) return

    setError(null)

    // Validate all fields
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (usernameError) {
      setError(usernameError);
      return;
    }

    if (emailError) {
      setError(emailError);
      return;
    }

    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signUp(username, email, password);

      if (result.success) {
        toast({
          title: "Account created!",
          description: "Welcome to Alif! Your account has been created successfully."
        });

        // Use setTimeout to give the auth state time to update
        setTimeout(() => {
          router.push('/study-assistant');
        }, 100);
      } else {
        setError(result.message);
      }
    } catch (err) {
      console.error("Registration error:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Combined loading state from form submission and auth context
  const isLoading = isSubmitting || authLoading;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 flex flex-col items-center">
          <div className="h-16 w-16 mb-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">A</span>
          </div>
          <CardTitle className="text-2xl font-bold text-center">Create an account</CardTitle>
          <p className="text-gray-500 dark:text-gray-400 text-center">
            Sign up to get started with Alif
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300 text-sm rounded">
                  {error === 'Connection error. Please try again later.' ? (
                    <>
                      Cannot connect to authentication server. Please make sure the backend is running at <code className="bg-red-100 dark:bg-red-900 px-1 rounded">http://localhost:8000</code>.
                    </>
                  ) : (
                    error
                  )}
                </div>
              )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="username"
              />
              <p className="text-xs text-gray-500">Username must be 3-50 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="new-password"
              />
              <p className="text-xs text-gray-500">Password must be at least 8 characters long</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
                autoComplete="new-password"
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
                  Creating account...
                </>
              ) : (
                "Sign up"
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-gray-500 dark:text-gray-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Sign in
                </Link>
              </span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}