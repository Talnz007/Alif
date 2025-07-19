/**
 * Activity type constants to ensure consistency between frontend and backend
 */

// Map of frontend enum values to backend values
export const BACKEND_ACTIVITY_TYPES = {
  // These match what the Python badge checker expects
  LOGIN: "login", // Will also match "user_login" in backend
  AUDIO_UPLOADED: "audio_processed", // What badge checker looks for
  DOCUMENT_UPLOADED: "document_analyzed", // What badge checker looks for
  TEXT_SUMMARIZED: "text_summarized", // Matches already
  GOAL_SET: "goal_created", // What badge checker looks for
  GOAL_COMPLETED: "goal_achieved", // What badge checker looks for
  QUESTION_ASKED: "question_asked", // Matches already
  MATH_PROBLEM_SOLVED: "math_problem_solved",
  QUIZ_GENERATED: "quiz_generated",
  QUIZ_COMPLETED: "quiz_completed",
  FLASHCARDS_GENERATED: "flashcards_generated",
  CHAT_MESSAGE_SENT: "chat_message_sent" // New mapping
};

/**
 * Standardizes an activity type from frontend to what the backend expects
 * @param type The frontend activity type (from enum or string)
 * @returns The standardized activity type that the badge checker expects
 */
export function standardizeActivityType(type: string): string {
  const upperType = type.toUpperCase();

  // Check if we have a mapping for this type
  if (upperType in BACKEND_ACTIVITY_TYPES) {
    return BACKEND_ACTIVITY_TYPES[upperType as keyof typeof BACKEND_ACTIVITY_TYPES];
  }

  // If no mapping found, return the original type
  console.warn(`No backend mapping found for activity type: ${type}`);
  return type;
}