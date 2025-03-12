import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1/users"

export async function GET(request: NextRequest) {
  try {
    // Get authorization header from request
    const authHeader = request.headers.get('Authorization')

    if (!authHeader) {
      return NextResponse.json(
        { error: 'No authorization token provided' },
        { status: 401 }
      )
    }

    // Forward the request to backend with the auth header
    const response = await fetch(`${API_URL}/me`, {
      headers: {
        'Authorization': authHeader
      }
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to get user profile' },
        { status: response.status }
      )
    }

    const userData = await response.json()

    return NextResponse.json({
      user: {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        full_name: userData.full_name || null,
        avatar_url: userData.avatar_url || null,
        bio: userData.bio || null,
        subjects: userData.subjects || [],
        created_at: userData.created_at,
        updated_at: userData.updated_at
      }
    })
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}