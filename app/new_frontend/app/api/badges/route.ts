import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
import { ensureUuid, debugUuid } from '@/lib/utils/uuid-helper';

interface Badge {
  id: number;
  name: string;
  description: string;
  image_url: string;
  category: string;
  created_at: string;
}

interface UserBadgeResponse {
  badge_id: number;
  is_earned: boolean;
  progress: number;
  earned_at: string | null;
  badges: Badge; // Single badge object, not array
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const rawUserId = searchParams.get("userId") || request.headers.get('x-user-id') || '1';
    const showAll = searchParams.get("showAll") === "true";

    // Debug the UUID before conversion
    console.log(`Raw user ID from request: ${rawUserId}`);


    // Use your updated ensureUuid function to get the actual UUID
    const userId = await ensureUuid(rawUserId);
    console.log(`Fetching badges for user: ${userId}, showAll: ${showAll}`);

    const supabase = await supabaseServerClient();

    if (showAll) {
      // Get all badges with user progress (for badge gallery view)
      const { data: allBadges, error: allBadgesError } = await supabase
        .from('badges')
        .select('*')
        .order('id');

      if (allBadgesError) {
        console.error('Error fetching all badges:', allBadgesError);
        return NextResponse.json([], { status: 200 });
      }

      // Get user progress for all badges
      const { data: userBadges, error: userBadgesError } = await supabase
        .from('user_badges')
        .select('badge_id, is_earned, progress, earned_at')
        .eq('user_id', userId);

      const badgeProgressMap = new Map();
      if (userBadges && !userBadgesError) {
        userBadges.forEach((badge: any) => {
          badgeProgressMap.set(badge.badge_id, {
            is_earned: badge.is_earned || false,
            progress: badge.progress || 0,
            earned_at: badge.earned_at || null
          });
        });
      }

      const formattedBadges = (allBadges || []).map((badge: Badge) => {
        const userProgress = badgeProgressMap.get(badge.id) || {
          is_earned: false,
          progress: 0,
          earned_at: null
        };

        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          image_url: badge.image_url,
          category: badge.category,
          created_at: badge.created_at,
          is_earned: userProgress.is_earned,
          progress: userProgress.progress,
          earned_at: userProgress.earned_at
        };
      });

      console.log(`Returning ${formattedBadges.length} badges (all) for user`);
      return NextResponse.json(formattedBadges);
    } else {
      // Get ONLY earned badges (default behavior)
      // Use explicit join instead of nested select
      const { data: earnedBadges, error } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          is_earned,
          progress,
          earned_at
        `)
        .eq('user_id', userId)
        .eq('is_earned', true);

      if (error) {
        console.error('Error fetching earned badges:', error);
        return NextResponse.json([], { status: 200 });
      }

      if (!earnedBadges || earnedBadges.length === 0) {
        console.log('No earned badges found for user');
        return NextResponse.json([]);
      }

      // Get badge details separately
      const badgeIds = earnedBadges.map(ub => ub.badge_id);
      const { data: badgeDetails, error: badgeError } = await supabase
        .from('badges')
        .select('*')
        .in('id', badgeIds);

      if (badgeError) {
        console.error('Error fetching badge details:', badgeError);
        return NextResponse.json([], { status: 200 });
      }

      // Combine the data
      const badgeMap = new Map(badgeDetails?.map(badge => [badge.id, badge]) || []);

      const formattedBadges = earnedBadges.map((userBadge: any) => {
        const badge = badgeMap.get(userBadge.badge_id);
        if (!badge) return null;

        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          image_url: badge.image_url,
          category: badge.category,
          created_at: badge.created_at,
          is_earned: userBadge.is_earned,
          progress: userBadge.progress,
          earned_at: userBadge.earned_at
        };
      }).filter(Boolean); // Remove null entries

      console.log(`Returning ${formattedBadges.length} earned badges for user`);
      return NextResponse.json(formattedBadges);
    }

  } catch (error) {
    console.error('Error fetching badges:', error);
    return NextResponse.json([], { status: 500 });
  }
}