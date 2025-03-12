import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/auth"

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    // If we have a session, return the user
    if (data.session) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.session.user.id)
        .single()

      if (userError) {
        throw userError
      }

      return NextResponse.json({
        authenticated: true,
        user: userData
      })
    }

    // No session
    return NextResponse.json({
      authenticated: false,
      user: null
    })
  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { authenticated: false, error: 'Session validation failed' },
      { status: 401 }
    )
  }
}