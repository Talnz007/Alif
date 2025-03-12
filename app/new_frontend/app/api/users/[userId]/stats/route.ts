import { NextRequest, NextResponse } from 'next/server';
import { ensureUuid } from '@/lib/utils/uuid-helper';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get the user ID from headers
    const rawUserId = request.headers.get('x-user-id');

    if (!rawUserId) {
      return NextResponse.json(
        { error: 'User ID is required in x-user-id header' },
        { status: 400 }
      );
    }

    console.log(`Assignment stats raw user ID: ${rawUserId}`);

    // Ensure it's a valid UUID - IMPORTANT: await the result
    const userId = await ensureUuid(rawUserId);
    console.log(`Assignment stats resolved user ID: ${userId}`);

    // Get completed assignments
    const { data: assignments, error: assignmentsError } = await supabase
      .from('user_activities')
      .select('id, metadata, timestamp')
      .eq('user_id', userId)
      .eq('activity_type', 'assignment_completed')
      .order('timestamp', { ascending: false });

    if (assignmentsError) {
      console.error('Error fetching assignment data:', assignmentsError);
      throw assignmentsError;
    }

    // Calculate stats
    const totalCompleted = assignments?.length || 0;

    // Calculate average score
    let averageScore = 0;
    let scoreCount = 0;

    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        if (assignment.metadata?.score) {
          averageScore += parseInt(assignment.metadata.score);
          scoreCount++;
        }
      });

      if (scoreCount > 0) {
        averageScore = Math.round(averageScore / scoreCount);
      }
    }

    // Get recent assignments (last 3)
    const recentAssignments = assignments && assignments.length > 0
      ? assignments.slice(0, 3).map(assignment => ({
          id: assignment.id,
          title: assignment.metadata?.title || 'Assignment',
          score: parseInt(assignment.metadata?.score) || 0,
          date: assignment.timestamp
        }))
      : [];

    return NextResponse.json({
      totalCompleted,
      averageScore,
      currentStreak: 0, // Mock value since we don't have assignment_streak
      recentAssignments
    });

  } catch (error) {
    console.error('Error fetching assignment stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assignment statistics' },
      { status: 500 }
    );
  }
}