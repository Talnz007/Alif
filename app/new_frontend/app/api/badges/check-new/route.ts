import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
import { ensureUuid } from '@/lib/utils/uuid-helper';

// Define proper types for the Supabase response
interface BadgeDetails {
  id: number | string;
  name: string;
  description: string;
  image_url: string;
}

// Updated interface to match the actual response structure
interface UserBadge {
  badge_id: number | string;
  is_earned: boolean;
  badges: {
    id: number | string;
    name: string;
    description: string;
    image_url: string;
  };
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

    // Get valid UUID
    const userId = await ensureUuid(rawUserId);

    // Get Supabase client
    const supabase = await supabaseServerClient();

    // First check if we need to add notification_shown column
    try {
      const { error } = await supabase.rpc('check_column_exists', {
        table_name: 'user_badges',
        column_name: 'notification_shown'
      });

      if (error) {
        // Column might not exist, try to add it
        await supabase.rpc('add_column_if_not_exists', {
          table_name: 'user_badges',
          column_name: 'notification_shown',
          column_type: 'boolean',
          default_value: 'false'
        });
      }
    } catch (e) {
      console.log('Error checking column, assuming it exists:', e);
    }

    // Query for newly earned badges that haven't been shown yet
    const { data: userBadges, error } = await supabase
      .from('user_badges')
      .select('badge_id, is_earned, badges(id, name, description, image_url)')
      .eq('user_id', userId)
      .eq('is_earned', true)
      .eq('notification_shown', false);

    if (error) {
      console.error('Error fetching new badges:', error);
      return NextResponse.json(
        { error: 'Failed to fetch badges' },
        { status: 500 }
      );
    }

    // Use type assertion to fix TypeScript error with an intermediate type
    const typedUserBadges = userBadges as any as UserBadge[];

    // Extract badge data for notifications
    const badgeNotifications = typedUserBadges
      ?.filter(item => item.badges) // Filter out any items with null badges
      .map(item => ({
        id: item.badge_id,
        name: item.badges.name,
        description: item.badges.description,
        image_url: item.badges.image_url
      })) || [];

    if (badgeNotifications.length > 0) {
      console.log(`Found ${badgeNotifications.length} new badge(s) for user ${userId}`);

      // Mark badges as shown
      const badgeIds = typedUserBadges
        ?.filter(item => item.badges) // Filter out any items with null badges
        .map(item => item.badge_id) || [];

      if (badgeIds.length > 0) {
        await supabase
          .from('user_badges')
          .update({ notification_shown: true })
          .eq('user_id', userId)
          .in('badge_id', badgeIds);
      }
    }

    return NextResponse.json({ newBadges: badgeNotifications });

  } catch (error) {
    console.error('Error in check-new badges API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}