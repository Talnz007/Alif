import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // No need to call backend as token is stored client-side in localStorage
    // Just return success response

    // For middleware to detect logged out state
    const response = NextResponse.json({ success: true })
    response.cookies.delete('_auth_token_exists')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}