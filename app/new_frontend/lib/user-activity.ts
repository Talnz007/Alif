import { ActivityType } from '@/lib/utils/activity-types';
import { standardizeActivityType } from '@/lib/utils/activity-constants';


/**
 * Log a user activity with the backend
 * This function wraps our activity logging API
 */
export async function logUserActivity(
  activityType: ActivityType | string,
  metadata?: any
): Promise<{ success: boolean; newBadges?: any[] }> {
  try {
    // Get user ID from storage
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error('Cannot log activity: No user ID found');
      return { success: false };
    }

    // Standardize activity type to ensure backend compatibility
    const typeValue = typeof activityType === 'string'
      ? activityType
      : String(activityType);

    const standardizedType = standardizeActivityType(typeValue);

    // Log the conversion for debugging
    if (standardizedType !== typeValue) {
      console.log(`Converting activity type: ${typeValue} → ${standardizedType}`);
    }

    // Rest of the function remains the same, but use standardizedType
    const response = await fetch('/api/activities/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        activityType: standardizedType, // Use standardized type
        metadata
      })
    });

    if (!response.ok) {
      console.error('Failed to log activity:', await response.text());
      return { success: false };
    }

    const data = await response.json();
    return {
      success: true,
      newBadges: data.newBadges
    };
  } catch (error) {
    console.error('Error logging activity:', error);
    return { success: false };
  }
}

/**
 * Convenience functions for logging different types of activities
 */
export const UserActivity = {
  /**
   * Log a login activity (First Step, Daily Learner, Consistent Learner badges)
   */
  login: async () => logUserActivity(ActivityType.LOGIN),

  /**
   * Log a text summarization (Summarization Star, Knowledge Seeker badges)
   * @param textLength - Length of the text being summarized
   */
  summarizeText: async (textLength: number) =>
    logUserActivity(ActivityType.TEXT_SUMMARIZED, { textLength }),

  /**
   * Log audio file processing (Audio Enthusiast, Audio Analyzer badges)
   * @param filename - Name of the audio file
   * @param durationSeconds - Duration of the audio in seconds
   */
  uploadAudio: async (filename: string, durationSeconds: number) =>
    logUserActivity(ActivityType.AUDIO_UPLOADED, { filename, durationSeconds }),

  /**
   * Log document processing (Document Guru, Document Pro badges)
   * @param filename - Name of the document
   * @param pageCount - Number of pages in the document
   */
  uploadDocument: async (filename: string, pageCount: number) =>
    logUserActivity(ActivityType.DOCUMENT_UPLOADED, { filename, pageCount }),

  /**
   * Log question asked (Curious Learner badge)
   * @param question - The question asked
   */
  askQuestion: async (question: string) =>
    logUserActivity(ActivityType.QUESTION_ASKED, { question }),

  /**
   * Log goal creation (Goal Setter badge)
   * @param goalId - ID of the created goal
   * @param goalType - Type of goal created
   */
  setGoal: async (goalId: string, goalType: string) =>
    logUserActivity(ActivityType.GOAL_SET, { goalId, goalType }),

  /**
   * Log goal completion (Goal Achiever badge)
   * @param goalId - ID of the completed goal
   */
  completeGoal: async (goalId: string) =>
    logUserActivity(ActivityType.GOAL_COMPLETED, { goalId }),

  /**
   * Log assignment completion (helps with streak badges)
   * @param assignmentId - ID of the completed assignment
   * @param score - Score achieved on the assignment
   */
  completeAssignment: async (assignmentId: string, score: number) =>
    logUserActivity(ActivityType.ASSIGNMENT_COMPLETED, { assignmentId, score }),

  /**
   * Log quiz completion (helps with streak badges)
   * @param quizId - ID of the completed quiz
   * @param score - Score achieved on the quiz
   */
  completeQuiz: async (quizId: string, score: number) =>
    logUserActivity(ActivityType.QUIZ_COMPLETED, { quizId, score }),

  /**
   * Log study session start
   */
  startStudySession: async () =>
    logUserActivity(ActivityType.STUDY_SESSION_START),

  /**
   * Log study session end (affects streak badges)
   * @param durationMinutes - Duration of the study session in minutes
   */
  endStudySession: async (durationMinutes: number) =>
    logUserActivity(ActivityType.STUDY_SESSION_END, { durationMinutes })
};