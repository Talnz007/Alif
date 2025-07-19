import { NextRequest, NextResponse } from 'next/server';
import { ensureUuid } from '@/lib/utils/uuid-helper';
import { supabase } from '@/lib/supabase';

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
      console.error('Error fetching quiz data:', quizError);
      throw quizError;
    }

    const totalCompleted = quizActivities?.length || 0;
    let totalCorrect = 0;
    let totalQuestions = 0;
    let averageScore = 0;

    if (quizActivities && quizActivities.length > 0) {
      quizActivities.forEach(activity => {
        const metadata = typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata;
        if (metadata?.correct_answers && metadata?.total_questions) {
          totalCorrect += metadata.correct_answers;
          totalQuestions += metadata.total_questions;
        }
      });
      averageScore = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    }

    const recentQuizzes = quizActivities && quizActivities.length > 0
      ? quizActivities.slice(0, 3).map(activity => {
          const metadata = typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata;
          return {
            id: activity.id,
            title: JSON.stringify(metadata), // Store metadata as string for parsing in component
            score: metadata?.correct_answers || 0,
            date: activity.timestamp
          };
        })
      : [];

    return NextResponse.json({
      totalCompleted,
      averageScore,
      currentStreak: 0, // Placeholder
      recentQuizzes
    });
  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    return NextResponse.json({
      totalCompleted: 0,
      averageScore: 0,
      currentStreak: 0,
      recentQuizzes: []
    });
  }
}