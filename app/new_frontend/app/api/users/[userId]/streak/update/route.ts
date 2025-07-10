import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
import { ensureUuid } from '@/lib/utils/uuid-helper';

// List of activity types that count for streaks
export const STREAK_QUALIFYING_TYPES = [
  "quiz_started",
  "assignment_generated",
  "assignment_completed",
  "quiz_completed",
  "study_session_end",
  "math_problem_solved",
  "audio_uploaded",
  "document_uploaded",
  "text_summarized",
  "flashcards_generated",
  "goal_set",
  "goal_completed",
  "question_asked"
];

// Utility: Convert Date to YYYY-MM-DD string (UTC)
function dateToDayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = await ensureUuid(params.userId);
    const supabase = await supabaseServerClient();

    // Fetch the last 30 streak-qualifying activities for this user
    const { data: activities, error: actError } = await supabase
      .from('user_activities')
      .select('timestamp')
      .eq('user_id', userId)
      .in('activity_type', STREAK_QUALIFYING_TYPES)
      .order('timestamp', { ascending: false })
      .limit(30);

    if (actError) throw actError;

    if (!activities || activities.length === 0) {
      // No activities, reset streak
      await supabase
        .from('user_streaks')
        .upsert({
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_activity_date: null
        }, { onConflict: 'user_id' });
      return NextResponse.json({ success: true, message: 'No activities: streak reset.' });
    }

    // Build an array of unique activity days (UTC, YYYY-MM-DD), most recent first
    const uniqueDays = [];
    const seen = new Set();
    for (const act of activities) {
      const dayKey = dateToDayKey(new Date(act.timestamp));
      if (!seen.has(dayKey)) {
        uniqueDays.push(dayKey);
        seen.add(dayKey);
      }
    }

    // Calculate streak: count how many consecutive days (from today) user has activity
    let streak = 0;
    const todayKey = dateToDayKey(new Date());
    let expectedKey = todayKey;
    for (const dayKey of uniqueDays) {
      if (dayKey === expectedKey) {
        streak += 1;
        // Move expectedKey to previous day
        const d = new Date(expectedKey);
        d.setDate(d.getDate() - 1);
        expectedKey = dateToDayKey(d);
      } else {
        break;
      }
    }

    // Get current streak record
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    let longestStreak = streak;
    if (streakData && (streakData.longest_streak || 0) > streak) {
      longestStreak = streakData.longest_streak;
    }

    // Upsert streak record
    await supabase
      .from('user_streaks')
      .upsert({
        user_id: userId,
        current_streak: streak,
        longest_streak: longestStreak,
        last_activity_date: activities[0].timestamp,
      }, { onConflict: 'user_id' });

    return NextResponse.json({
      success: true,
      message: 'Streak updated successfully',
      currentStreak: streak,
      longestStreak,
      lastActivityDate: activities[0].timestamp,
    });

  } catch (error) {
    console.error('Error updating streak:', error);
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    );
  }
}