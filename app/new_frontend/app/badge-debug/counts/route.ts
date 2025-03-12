import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
import { ensureUuid } from '@/lib/utils/uuid-helper';

interface ActivityCounts {
  [key: string]: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawUserId = searchParams.get("userId") || request.headers.get('x-user-id');

    if (!rawUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userId = await ensureUuid(rawUserId);
    const supabase = await supabaseServerClient();

    // Get activities grouped by type
    const { data, error } = await supabase
      .from('user_activities')
      .select('activity_type')
      .eq('user_id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count occurrences of each activity type
    const counts: ActivityCounts = {};
    data?.forEach(activity => {
      const type = activity.activity_type;
      counts[type] = (counts[type] || 0) + 1;
    });

    return NextResponse.json({
      userId,
      activityCounts: counts,
      totalActivities: data?.length || 0
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to count activities' }, { status: 500 });
  }
}