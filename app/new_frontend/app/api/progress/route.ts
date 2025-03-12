import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ensureUuid, debugUuid } from '@/lib/utils/uuid-helper';

export async function GET(
  request: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    const { userId: rawUserId } = context.params;

    // Debug the UUID conversion
    debugUuid(rawUserId);

    // Convert userId to valid UUID format
    const userId = ensureUuid(rawUserId);
    console.log(`Fetching progress data for user: ${userId}`);

    // Get user's streak data
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (streakError && streakError.code !== 'PGRST116') {
      console.error("Error fetching streak data:", streakError);
    }

    // Get user's activities for progress calculation
    const { data: activities, error: activitiesError } = await supabase
      .from('user_activities')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(100);

    if (activitiesError) {
      console.error("Error fetching activities:", activitiesError);
    }

    // Calculate progress data based on activities
    const progressData = calculateProgressData(activities || [], streakData);

    return NextResponse.json(progressData);
  } catch (error) {
    console.error("Progress API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch progress data" },
      { status: 500 }
    );
  }
}

function calculateProgressData(activities: any[], streakData: any) {
  // Default values if no data available
  const defaultData = {
    overallProgress: 75,
    studyStreak: streakData?.current_streak || 0,
    timeSpentHours: 0,
    topSubjects: [
      { name: 'Mathematics', progress: 85 },
      { name: 'Physics', progress: 78 },
      { name: 'Computer Science', progress: 92 }
    ]
  };

  // If we don't have activities data, return defaults
  if (!activities || activities.length === 0) {
    return defaultData;
  }

  // Calculate time spent (placeholder calculation)
  const timeSpentHours = activities
    .filter(a => a.activity_type === 'study_session_end' && a.details?.duration)
    .reduce((total, a) => total + (a.details.duration / 60), 0);

  // Calculate subject progress (simplified implementation)
  const subjectProgress: Record<string, { count: number, progress: number }> = {};

  activities.forEach(activity => {
    if (activity.details?.subject) {
      const subject = activity.details.subject;
      if (!subjectProgress[subject]) {
        subjectProgress[subject] = { count: 0, progress: 0 };
      }
      subjectProgress[subject].count++;

      // Add progress if available
      if (activity.details?.progress) {
        subjectProgress[subject].progress = activity.details.progress;
      }
    }
  });

  // Convert to array and sort by progress
  const topSubjects = Object.entries(subjectProgress)
    .map(([name, data]) => ({
      name,
      progress: data.progress || Math.min(data.count * 5, 100) // Fallback calculation
    }))
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 3);

  // If we don't have enough subjects, fill with defaults
  while (topSubjects.length < 3) {
    const defaultSubjects = defaultData.topSubjects.filter(
      s => !topSubjects.some(t => t.name === s.name)
    );

    if (defaultSubjects.length > 0) {
      topSubjects.push(defaultSubjects[0]);
    } else {
      break;
    }
  }

  return {
    overallProgress: Math.min(activities.length, 100),
    studyStreak: streakData?.current_streak || 0,
    timeSpentHours: timeSpentHours || defaultData.timeSpentHours,
    topSubjects: topSubjects.length > 0 ? topSubjects : defaultData.topSubjects
  };
}