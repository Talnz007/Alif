import { NextRequest, NextResponse } from "next/server";

const API_URL =  "http://127.0.0.1:8000/api/v1/auth";

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const route = searchParams.get("route");

    if (!route) {
      return NextResponse.json(
        { error: "Missing route parameter" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const response = await fetch(`${API_URL}/${route}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}