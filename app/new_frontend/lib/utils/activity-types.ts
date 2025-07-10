/**
 * Types for activity logging system
 */

// Define activity types
export enum ActivityType {
  LOGIN = "login",
  LOGOUT = "logout",
  ASSIGNMENT_STARTED = "assignment_generated",
  ASSIGNMENT_COMPLETED = "assignment_completed",
  QUIZ_STARTED = "quiz_started",
  QUIZ_COMPLETED = "quiz_completed",
  STUDY_SESSION_START = "study_session_start",
  STUDY_SESSION_END = "study_session_end",
  DOCUMENT_VIEWED = "document_viewed",
  DOCUMENT_UPLOADED = "document_uploaded",
  AUDIO_UPLOADED = "audio_uploaded",
  TEXT_SUMMARIZED = "text_summarized",
  GOAL_SET = "goal_set",
  GOAL_COMPLETED = "goal_completed",
  QUESTION_ASKED = "question_asked"
}

// Additional metadata for activities
export interface ActivityMetadata {
  assignmentId?: string;
  score?: number;
  duration?: number; // in minutes
  contentId?: string;
  subject?: string;
  difficulty?: string;
  title?: string;
  [key: string]: any; // Allow additional properties
}
