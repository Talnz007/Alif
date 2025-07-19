/**
 * Frontend utility for logging user activities through the API
 */
import { ActivityType, ActivityMetadata } from '@/lib/utils/activity-types';
import { useAuth } from '@/contexts/auth-context';

/**
 * Log a user activity to the server through the API endpoint
 * @param userId User ID
 * @param activityType Activity type from the ActivityType enum
 * @param metadata Additional data about the activity
 */
export async function logActivity(
  userId: string | number,
  activityType: ActivityType | string,
  metadata: ActivityMetadata = {}
): Promise<boolean> {
  try {
    const { token } = useAuth(); // Get token
    console.log(`Logging activity: ${activityType}`, { userId, metadata });

    const response = await fetch('/api/activities/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        userId,
        activityType,
        metadata,
        timestamp: new Date().toISOString(),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Activity logging failed:', data.error);
      return false;
    }

    console.log('Activity logged successfully:', data);
    return true;
  } catch (error) {
    console.error('Error logging activity:', error);
    return false;
  }
}

/**
 * Helper for logging assignment completion
 */
export function logAssignmentCompleted(
  userId: string | number,
  assignmentId: string,
  score: number,
  subject: string,
  title: string
): Promise<boolean> {
  return logActivity(
    userId,
    ActivityType.ASSIGNMENT_COMPLETED,
    {
      assignmentId,
      score,
      subject,
      title,
    }
  );
}

/**
 * Helper for logging study sessions
 */
export function logStudySessionEnd(
  userId: string | number,
  subject: string,
  durationMinutes: number,
  startTime: Date
): Promise<boolean> {
  return logActivity(
    userId,
    ActivityType.STUDY_SESSION_END,
    {
      subject,
      duration: durationMinutes,
      startTime: startTime.toISOString(),
      endTime: new Date().toISOString()
    }
  );
}