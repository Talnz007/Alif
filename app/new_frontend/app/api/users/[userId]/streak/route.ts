import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
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

    // Convert userId to valid UUID format - await the result
    const userId = await ensureUuid(rawUserId);
    const supabase = await supabaseServerClient();

    // Rest of your function remains the same...
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('current_streak, longest_streak, last_activity_date')
      .eq('user_id', userId)
      .single();

    if (streakError && streakError.code !== 'PGRST116') throw streakError;

    const current = streakData?.current_streak || 0;
    const longest = streakData?.longest_streak || 0;

    // Check if any activity was completed today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const { data: todayActivities, error: todayError } = await supabase
      .from('user_activities')
      .select('id')
      .eq('user_id', userId)
      .in('activity_type', ['assignment_completed', 'quiz_completed', 'study_session_end'])
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString());

    if (todayError) throw todayError;

    const todayCompleted = todayActivities && todayActivities.length > 0;

    // Calculate weekly progress (days active this week / 7)
    const weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - today.getDay()); // Sunday

    const { data: weeklyActivities, error: weeklyError } = await supabase.rpc(
      'get_active_days_in_period',
      {
        user_id_param: userId,
        start_date: weekStart.toISOString(),
        end_date: tomorrow.toISOString()
      }
    );

    if (weeklyError) throw weeklyError;

    const activeDaysThisWeek = weeklyActivities || 0;
    const weeklyProgress = Math.round((activeDaysThisWeek / 7) * 100);

    // Determine streak level and next milestone
    let level = "bronze";
    let nextMilestone = 3;

    if (current >= 30) {
      level = "platinum";
      nextMilestone = 50;
    } else if (current >= 14) {
      level = "gold";
      nextMilestone = 30;
    } else if (current >= 7) {
      level = "silver";
      nextMilestone = 14;
    } else if (current >= 3) {
      level = "bronze";
      nextMilestone = 7;
    } else {
      nextMilestone = 3;
    }

    return NextResponse.json({
      current,
      longest,
      todayCompleted,
      weeklyProgress,
      level,
      nextMilestone
    });

  } catch (error) {
    console.error('Error fetching streak data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch streak data' },
      { status: 500 }
    );
  }
}