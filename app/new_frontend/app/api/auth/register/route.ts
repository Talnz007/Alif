import { NextRequest, NextResponse } from "next/server"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1/auth";

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const { username, email, password } = data

    console.log("Sending registration request to backend:",
      JSON.stringify({
        username,
        email,
        password: "[REDACTED]"
      })
    )

    // Call the backend register endpoint - use exact URL from your working curl
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    })

    console.log("Backend registration response status:", response.status)

    // Get response data
    let responseData
    try {
      responseData = await response.json()
      console.log("Registration response data received")
    } catch (err) {
      console.error("Failed to parse registration response:", err)
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.detail || 'Registration failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Registration API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}