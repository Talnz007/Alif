import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Access the form data from the request
    const formData = await request.formData();
    const imageFile = formData.get("file") as File;

    if (!imageFile) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Create a new FormData instance to forward to the backend
    const backendFormData = new FormData();
    backendFormData.append("file", imageFile);

    // Use the backend API to solve the math problem
    // Construct URL from environment variable
    const apiBaseUrl = "http://localhost:8000/api/v1";
    const backendUrl = `${apiBaseUrl}/math-solver/solve`;

    console.log(`Sending request to math solver API: ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method: "POST",
      body: backendFormData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Backend error:", errorText);
      return NextResponse.json(
        { error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    // Return the solution from the backend
    const solution = await response.json();
    return NextResponse.json(solution);

  } catch (error) {
    console.error("Error processing math problem:", error);
    return NextResponse.json(
      { error: "Failed to process math problem" },
      { status: 500 }
    );
  }
}