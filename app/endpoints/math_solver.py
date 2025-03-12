from fastapi import APIRouter, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
import google.generativeai as genai
from pydantic import BaseModel
from app.core.app_logging import app_logger

# Create a router
router = APIRouter(prefix="/math-solver", tags=["Math Solver"])


class SolverResponse(BaseModel):
    extracted_problem: str
    solution: str
    katex_solution: str


@router.post("/solve", response_model=SolverResponse)
async def solve_math_problem(file: UploadFile = File(...)):
    """
    Endpoint to solve a math problem from an uploaded image.

    - Extracts the math problem from the image
    - Solves the problem
    - Returns the solution in KaTeX format
    """

    # Check if the file is an image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        # Read the image file
        image_content = await file.read()

        # Get initialized model from the global context
        try:
            model = genai.GenerativeModel('gemini-2.0-flash')
            app_logger.info("Using Gemini 2.0 Flash model for math solver")
        except Exception as e:
            app_logger.error(f"Failed to initialize Gemini model: {e}")
            raise HTTPException(status_code=500, detail="Failed to initialize AI model")

        # Create a prompt for Gemini
        prompt = """
        I'll show you an image of a math problem. Please:
        1. Extract the exact math problem from the image
        2. Solve the problem step by step
        3. Provide the final answer
        4. Format the final answer in KaTeX syntax for rendering

        Return your response in this structured format:
        Extracted Problem: [problem text]
        Solution: [step by step solution in katex format]
        KaTeX: [katex formatted answer]
        """

        # Send the image and prompt to Gemini
        response = model.generate_content(
            [prompt, {"mime_type": file.content_type, "data": image_content}]
        )

        response_text = response.text
        app_logger.debug(f"Raw Gemini response: {response_text[:200]}...")

        # Extract the sections from the response
        extracted_problem = ""
        solution = ""
        katex = ""

        if "Extracted Problem:" in response_text:
            parts = response_text.split("Solution:")
            if len(parts) > 0:
                extracted_problem = parts[0].replace("Extracted Problem:", "").strip()

            if len(parts) > 1:
                remaining = parts[1]
                if "KaTeX:" in remaining:
                    sol_parts = remaining.split("KaTeX:")
                    solution = sol_parts[0].strip()
                    if len(sol_parts) > 1:
                        katex = sol_parts[1].strip()
                else:
                    solution = remaining.strip()

        # If we couldn't parse the response correctly, use the whole response
        if not extracted_problem and not solution:
            app_logger.warning("Failed to parse Gemini's response correctly")
            return JSONResponse(
                status_code=500,
                content={
                    "error": "Failed to parse Gemini's response",
                    "raw_response": response_text
                }
            )

        app_logger.info(f"Successfully solved math problem: {extracted_problem[:50]}...")

        # Return the structured response
        return SolverResponse(
            extracted_problem=extracted_problem,
            solution=solution,
            katex_solution=katex
        )

    except Exception as e:
        app_logger.error(f"Error processing math problem image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@router.get("/")
def math_solver_info():
    """API information endpoint"""
    return {
        "name": "Math Problem Solver API",
        "description": "Upload an image of a math problem to get the solution in KaTeX format",
        "usage": "POST an image to /api/v1/math-solver/solve"
    }