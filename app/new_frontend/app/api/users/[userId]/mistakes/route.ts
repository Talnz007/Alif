import { NextRequest, NextResponse } from 'next/server';
import { ensureUuid } from '@/lib/utils/uuid-helper';
import { supabase } from '@/lib/supabase';

interface Answer {
  correct: boolean;
  question: string;
  userAnswer: string;
  correctAnswer: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: rawUserId } = await params;
    if (!rawUserId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const userId = await ensureUuid(rawUserId);

    const { data: quizActivities, error } = await supabase
      .from('user_activities')
      .select('metadata, timestamp')
      .eq('user_id', userId)
      .eq('activity_type', 'quiz_completed')
      .order('timestamp', { ascending: false });

    if (error || !quizActivities?.length) {
      return NextResponse.json({ message: 'No mistakes to review! 🎉' }, { status: 200 });
    }

    const mistakes = quizActivities.flatMap(activity => {
      const metadata = typeof activity.metadata === 'string' ? JSON.parse(activity.metadata) : activity.metadata;
      const answers = metadata?.answers || [];
      return answers.filter((answer: Answer) => !answer.correct).map((answer: Answer) => ({
        question: answer.question,
        userAnswer: answer.userAnswer,
        correctAnswer: answer.correctAnswer,
        date: activity.timestamp
      }));
    });

    return NextResponse.json({ mistakes }, { status: 200 });
  } catch (error) {
    console.error('Error fetching mistakes:', error);
    return NextResponse.json({ error: 'Failed to fetch mistakes' }, { status: 500 });
  }
}