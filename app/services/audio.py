import os
from pathlib import Path
from google import genai
from app.core.app_logging import app_logger


async def process_audio_file(file_path: Path, mode="both") -> dict:
    """
    Process audio file using Google Gemini.

    Args:
        file_path: Path to the audio file
        mode: 'transcript' for transcription only, 'summary' for summary only, 'both' for both

    Returns:
        Dictionary with transcript and/or summary information
    """
    try:
        app_logger.info(f"Processing audio file: {file_path} with mode: {mode}")

        # Initialize Gemini client
        client = genai.Client()
        model = "gemini-2.0-flash"

        # Upload the file to Gemini Files API
        app_logger.info(f"Uploading audio file to Gemini Files API")
        uploaded_file = client.files.upload(file=str(file_path))

        result = {}

        # Get transcript if needed
        if mode in ["transcript", "both"]:
            transcript_prompt = "Generate a complete, accurate transcript of this audio file."

            app_logger.info(f"Generating transcript using Gemini")
            transcript_response = client.models.generate_content(
                model=model,
                contents=[transcript_prompt, uploaded_file]
            )

            result["transcript"] = transcript_response.text.strip()

        # Get summary if needed
        if mode in ["summary", "both"]:
            # If we already have a transcript, use it in the summary prompt for better results
            if "transcript" in result:
                summary_prompt = f"""
                Based on the following transcript, please:
                1. Create a concise title that captures the main topic
                2. Write a short paragraph summary (3-5 sentences)
                3. Create a bullet point list of the key points (5-8 bullets)

                Format your response like this:
                Title: [Topic Title]

                Summary: [Short paragraph summary]

                Key Points:
                • [Point 1]
                • [Point 2]
                • [Point 3]
                ...

                Here's the transcript:
                {result["transcript"]}
                """

                app_logger.info(f"Generating summary from transcript")
                summary_response = client.models.generate_content(
                    model=model,
                    contents=summary_prompt
                )
            else:
                # If we don't have a transcript yet, ask Gemini to analyze the audio directly
                summary_prompt = """
                Listen to this audio and provide:
                1. A concise title that captures the main topic
                2. A short paragraph summary (3-5 sentences)
                3. A bullet point list of key points (5-8 bullets)

                Format your response like this:
                Title: [Topic Title]

                Summary: [Short paragraph summary]

                Key Points:
                • [Point 1]
                • [Point 2]
                • [Point 3]
                ...
                """

                app_logger.info(f"Generating direct summary from audio")
                summary_response = client.models.generate_content(
                    model=model,
                    contents=[summary_prompt, uploaded_file]
                )

            summary_text = summary_response.text

            # Parse the response
            title = ""
            summary = ""
            bullet_points = []

            if "Title:" in summary_text:
                parts = summary_text.split("Summary:")
                if len(parts) > 0:
                    title_part = parts[0].replace("Title:", "").strip()
                    title = title_part

                if len(parts) > 1:
                    remaining = parts[1]
                    if "Key Points:" in remaining:
                        summary_parts = remaining.split("Key Points:")
                        summary = summary_parts[0].strip()

                        if len(summary_parts) > 1:
                            points_text = summary_parts[1].strip()
                            # Extract bullet points
                            bullet_points = [
                                point.strip().lstrip('•').strip()
                                for point in points_text.split('\n')
                                if point.strip() and '•' in point
                            ]

                            # If no bullet points with • were found, try with -
                            if not bullet_points:
                                bullet_points = [
                                    point.strip().lstrip('-').strip()
                                    for point in points_text.split('\n')
                                    if point.strip() and '-' in point
                                ]

                            # If still no bullet points, just split by lines
                            if not bullet_points:
                                bullet_points = [
                                    point.strip()
                                    for point in points_text.split('\n')
                                    if point.strip()
                                ]

            result["title"] = title
            result["summary"] = summary
            result["bullet_points"] = bullet_points

        # Clean up by deleting the file from Gemini Files API
        try:
            client.files.delete(name=uploaded_file.name)
            app_logger.info(f"Deleted file from Gemini Files API: {uploaded_file.name}")
        except Exception as e:
            app_logger.warning(f"Failed to delete file from Gemini Files API: {e}")

        app_logger.info(f"Successfully processed audio file: {file_path}")
        return result

    except Exception as e:
        app_logger.error(f"Error processing audio file: {e}")
        raise RuntimeError(f"Failed to process audio: {str(e)}")