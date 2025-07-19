import { NextRequest, NextResponse } from 'next/server';
import { ensureUuid } from '@/lib/utils/uuid-helper';
import { supabase } from '@/lib/supabase';

export const revalidate = 43200; // 12 hours in seconds for ISR caching

export async function GET(request: NextRequest) {
  try {
    const rawUserId = request.headers.get('x-user-id');
    if (!rawUserId) {
      return NextResponse.json({ error: 'User ID is required in x-user-id header' }, { status: 400 });
    }

    console.log(`Assignment stats raw user ID: ${rawUserId}`);
    const userId = await ensureUuid(rawUserId);
    console.log(`Assignment stats resolved user ID: ${userId}`);

    const { data: quizActivities, error: quizError } = await supabase
      .from('user_activities')
      .select('id, timestamp, metadata')
      .eq('user_id', userId)
      .eq('activity_type', 'quiz_completed')
      .order('timestamp', { ascending: false });

    if (quizError) {
      console.error('Error fetching quiz data:', quizError.message);
      throw quizError;
    }

    const totalCompleted = quizActivities?.length || 0;
    let averageScore = 0;
    let scoreCount = 0;

    if (quizActivities && quizActivities.length > 0) {
      quizActivities.forEach(activity => {
        if (activity.metadata?.score) {
          averageScore += parseInt(activity.metadata.score);
          scoreCount++;
        }
      });
      averageScore = scoreCount > 0 ? Math.round(averageScore / scoreCount) : 0;
    }

    const recentQuizzes = quizActivities && quizActivities.length > 0
      ? quizActivities.slice(0, 3).map(activity => ({
          id: activity.id,
          title: activity.metadata?.title || activity.metadata?.source || 'Unnamed Quiz',
          score: parseInt(activity.metadata?.score) || 0,
          date: activity.timestamp,
          metadata: activity.metadata
        }))
      : [];

    // Fetch current streak
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('current_streak')
      .eq('user_id', userId)
      .single();

    if (streakError && streakError.code !== 'PGRST116') {
      console.error('Error fetching streak data:', streakError.message);
      throw streakError;
    }

    const currentStreak = streakData?.current_streak || 0;

    return NextResponse.json({
      totalCompleted,
      averageScore,
      currentStreak,
      recentQuizzes
    }, { headers: { 'Cache-Control': 's-maxage=43200, stale-while-revalidate' } });
  } catch (error) {
    console.error('Error fetching assignment stats:', error instanceof Error ? error.message : String(error));
    return NextResponse.json({
      totalCompleted: 0,
      averageScore: 0,
      currentStreak: 0,
      recentQuizzes: []
    }, { status: 500 });
  }
}