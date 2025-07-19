import { NextRequest, NextResponse } from 'next/server';
import { ensureUuid } from '@/lib/utils/uuid-helper';
import { supabase } from '@/lib/supabase';

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

    const { data: activities, error } = await supabase
      .from('user_activities')
      .select('timestamp, activity_type')
      .eq('user_id', userId)
      .order('timestamp', { ascending: true });

    if (error || !activities?.length) {
      return NextResponse.json({ trend: [] }, { status: 200 });
    }

    const trend = activities.map(a => ({
      date: new Date(a.timestamp).toISOString().split('T')[0],
      count: 1,
      type: a.activity_type
    }));

    return NextResponse.json({ trend }, { status: 200 });
  } catch (error) {
    console.error('Error fetching activity trend:', error);
    return NextResponse.json({ error: 'Failed to fetch trend' }, { status: 500 });
  }
}