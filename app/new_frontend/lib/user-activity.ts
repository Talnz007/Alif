import { ActivityType } from '@/lib/utils/activity-types';
import { standardizeActivityType } from '@/lib/utils/activity-constants';

/**
 * Log a user activity with the backend
 */
export async function logUserActivity(
  activityType: ActivityType | string,
  metadata?: any,
  token?: string | null
): Promise<{ success: boolean; newBadges?: any[] }> {
  try {
    const userId = localStorage.getItem('user_id');
    if (!userId) {
      console.error('Cannot log activity: No user ID found');
      return { success: false };
    }

    const typeValue = typeof activityType === 'string' ? activityType : String(activityType);
    const standardizedType = standardizeActivityType(typeValue);

    if (standardizedType !== typeValue) {
      console.log(`Converting activity type: ${typeValue} → ${standardizedType}`);
    }

    const response = await fetch('/api/activities/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        userId,
        activityType: standardizedType,
        metadata,
      }),
    });

    if (!response.ok) {
      console.error('Failed to log activity:', await response.text());
      return { success: false };
    }

    const data = await response.json();
    return {
      success: true,
      newBadges: data.newBadges,
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
  login: async (token?: string) => logUserActivity(ActivityType.LOGIN, {}, token),
  summarizeText: async (textLength: number, token?: string) =>
    logUserActivity(ActivityType.TEXT_SUMMARIZED, { textLength }, token),
  uploadAudio: async (filename: string, durationSeconds: number, token?: string) =>
    logUserActivity(ActivityType.AUDIO_UPLOADED, { filename, durationSeconds }, token),
  uploadDocument: async (filename: string, pageCount: number, token?: string) =>
    logUserActivity(ActivityType.DOCUMENT_UPLOADED, { filename, pageCount }, token),
  askQuestion: async (question: string, token?: string) =>
    logUserActivity(ActivityType.QUESTION_ASKED, { question }, token),
  setGoal: async (goalId: string, goalType: string, token?: string) =>
    logUserActivity(ActivityType.GOAL_SET, { goalId, goalType }, token),
  completeGoal: async (goalId: string, token?: string) =>
    logUserActivity(ActivityType.GOAL_COMPLETED, { goalId }, token),
  completeAssignment: async (assignmentId: string, score: number, token?: string) =>
    logUserActivity(ActivityType.ASSIGNMENT_COMPLETED, { assignmentId, score }, token),
  completeQuiz: async (quizId: string, score: number, token?: string) =>
    logUserActivity(ActivityType.QUIZ_COMPLETED, { quizId, score }, token),
  startStudySession: async (token?: string) =>
    logUserActivity(ActivityType.STUDY_SESSION_START, {}, token),
  endStudySession: async (durationMinutes: number, token?: string) =>
    logUserActivity(ActivityType.STUDY_SESSION_END, { durationMinutes }, token),
  chatMessageSent: async (messageLength: number, token?: string) =>
    logUserActivity(ActivityType.CHAT_MESSAGE_SENT, { messageLength }, token),
  dashboardVisit: async (token?: string) =>
    logUserActivity(ActivityType.DASHBOARD_VISIT, { timestamp: new Date().toISOString() }, token),
};