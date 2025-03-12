import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureUuid, debugUuid } from '@/lib/utils/uuid-helper';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Await the params object before accessing properties
    const { userId: rawUserId } = await params;

    // Debug the UUID conversion
    debugUuid(rawUserId);

    // Convert userId to valid UUID format
    const userId = await ensureUuid(rawUserId);

    // Rest of your function remains the same...
    const { data: completedAssignments, error: assignmentsError } = await supabase
      .from('user_activities')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', 'assignment_completed');

    if (assignmentsError) {
      console.error('Error fetching completed assignments:', assignmentsError);
      throw assignmentsError;
    }

    const assignmentCount = completedAssignments?.length || 0;

    // Get completed activities count (all types)
    const { data: completedActivities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('id')
      .eq('user_id', userId)
      .eq('activity_type', 'assignment_completed');

    if (activitiesError) {
      console.error('Error fetching activities:', activitiesError);
      throw activitiesError;
    }

    const activitiesCount = completedActivities?.length || 0;

    // Calculate overall progress
    const totalAvailable = 100;
    const overallProgress = Math.min(Math.round((activitiesCount / totalAvailable) * 100), 100);

    // Get streak information
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', userId);

    let studyStreak = 0;
    if (streakError) {
      if (streakError.code !== 'PGRST116') {
        console.error('Error fetching streak:', streakError);
      }
    } else if (streakData && streakData.length > 0) {
      studyStreak = streakData[0].current_streak;
    }

    // Get time spent learning this week
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: studyTimeData, error: studyTimeError } = await supabase
      .from('user_activities')
      .select('metadata')
      .eq('user_id', userId)
      .eq('activity_type', 'study_session_end')
      .gte('timestamp', weekAgo.toISOString())
      .lt('timestamp', today.toISOString());

    if (studyTimeError) {
      console.error('Error fetching study time:', studyTimeError);
      throw studyTimeError;
    }

    // Calculate total study time for the week
    let weeklyStudyMinutes = 0;
    if (studyTimeData) {
      studyTimeData.forEach(activity => {
        if (activity.metadata?.duration) {
          weeklyStudyMinutes += Number(activity.metadata.duration);
        }
      });
    }

    const timeSpentHours = (weeklyStudyMinutes / 60).toFixed(1);

    // Get top subjects based on assignment scores
    const { data: assignmentScores, error: scoresError } = await supabase
      .from('user_activities')
      .select('metadata')
      .eq('user_id', userId)
      .eq('activity_type', 'assignment_completed');

    if (scoresError) {
      console.error('Error fetching assignment scores:', scoresError);
      throw scoresError;
    }

    // Process subject data from assignments
    const subjectScores: Record<string, number[]> = {};

    if (assignmentScores) {
      assignmentScores.forEach(activity => {
        const subject = activity.metadata?.subject || 'General';
        const score = activity.metadata?.score;

        if (score !== undefined) {
          if (!subjectScores[subject]) {
            subjectScores[subject] = [];
          }
          subjectScores[subject].push(Number(score));
        }
      });
    }

    // Calculate average scores for each subject
    const topSubjects = Object.entries(subjectScores)
      .map(([subject, scores]) => ({
        name: subject,
        progress: Math.round(
          scores.reduce((sum, score) => sum + score, 0) / scores.length
        )
      }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);

    // If no subjects found, provide defaults
    if (topSubjects.length === 0) {
      topSubjects.push(
        { name: 'Mathematics', progress: 85 },
        { name: 'Physics', progress: 78 },
        { name: 'Computer Science', progress: 92 }
      );
    }

    return NextResponse.json({
      overallProgress,
      studyStreak,
      timeSpentHours,
      topSubjects,
      assignmentCount
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json(
      { error: 'Failed to fetch progress data' },
      { status: 500 }
    );
  }
}