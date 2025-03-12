import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get form data from request
    const formData = await request.formData()

    const username = formData.get('username') as string
    const password = formData.get('password') as string

    console.log("Sending login request to backend:",
      JSON.stringify({
        username,
        password: "[REDACTED]"
      })
    )

    // Create form data params exactly as in your curl
    const params = new URLSearchParams();
    params.append('grant_type', 'password');
    params.append('username', username);
    params.append('password', password);
    params.append('scope', '');
    params.append('client_id', 'string');
    params.append('client_secret', 'string');

    // Forward the form data to the backend - use exact URL from your working curl
    const response = await fetch('http://127.0.0.1:8000/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    console.log("Backend login response status:", response.status)

    // Get response data
    let responseData
    try {
      responseData = await response.json()
      console.log("Login response data received")
    } catch (err) {
      console.error("Failed to parse login response:", err)
      return NextResponse.json(
        { error: 'Invalid response from server' },
        { status: 500 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: responseData.detail || 'Login failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Login API route error:', error)
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    )
  }
}