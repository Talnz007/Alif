import { NextRequest, NextResponse } from 'next/server';
import { supabaseServerClient } from '@/lib/supabase';
import { ensureUuid } from '@/lib/utils/uuid-helper';
import { SupabaseClient } from '@supabase/supabase-js';

interface BackendCheckResult {
  success: boolean;
  data?: any;
}

interface AwardResult {
  badge: string;
  awarded: boolean;
}

export async function POST(request: NextRequest) {
  try {
    const { userId: rawUserId } = await request.json();

    if (!rawUserId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const userId = await ensureUuid(rawUserId);
    console.log(`Checking badges for user: ${userId}`);

    // First try to use backend badge checker if available
    const backendCheckResult = await checkBadgesBackend(userId);
    if (backendCheckResult.success) {
      console.log('Backend badge check successful');
      return NextResponse.json({
        // Fix: Remove duplicate success property
        message: 'Backend badge check completed',
        ...backendCheckResult
      });
    }

    console.log('Backend check failed or skipped, doing frontend check');

    // Fall back to frontend badge checking
    const supabase = await supabaseServerClient();
    const awardResults = await checkBadgesFrontend(supabase, userId);

    console.log('Frontend badge check results:', awardResults);

    // Get newly earned badges to return
    const { data: userBadges, error } = await supabase
      .from('user_badges')
      .select('badge_id, is_earned, earned_at, badges(id, name, description, image_url)')
      .eq('user_id', userId)
      .eq('is_earned', true)
      .order('earned_at', { ascending: false });

    if (error) {
      console.error('Error getting user badges:', error);
      return NextResponse.json(
        { error: 'Failed to get badges' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Badges checked successfully',
      badgesAwarded: awardResults.filter(r => r.awarded),
      badges: userBadges
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    return NextResponse.json(
      { error: 'Error checking badges' },
      { status: 500 }
    );
  }
}

// Try to use backend badge checker
async function checkBadgesBackend(userId: string): Promise<BackendCheckResult> {
  try {
    console.log(`Attempting backend badge check for user ${userId}`);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/api/v1/check-badges`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ user_id: userId }),
      // Short timeout to prevent long waits if backend is down
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) {
      console.warn('Backend badge check returned error:', response.status);
      return { success: false };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.warn('Error in backend badge check:', error);
    return { success: false };
  }
}

// Fallback frontend badge checking logic
async function checkBadgesFrontend(supabase: SupabaseClient, userId: string): Promise<AwardResult[]> {
  console.log(`Running frontend badge check for user ${userId}`);
  try {
    // Get counts of various activities
    const [loginCount, docCount, audioCount, textCount, questionCount] = await Promise.all([
      getActivityCount(supabase, userId, 'login'),
      getActivityCount(supabase, userId, 'document_uploaded'),
      getActivityCount(supabase, userId, 'audio_uploaded'),
      getActivityCount(supabase, userId, 'text_summarized'),
      getActivityCount(supabase, userId, 'question_asked')
    ]);

    console.log(`User ${userId} activity counts:`, {
      login: loginCount,
      docs: docCount,
      audio: audioCount,
      text: textCount,
      questions: questionCount
    });

    const awardResults: AwardResult[] = [];

    // Check for First Step badge (first login)
    if (loginCount > 0) {
      const result = await awardBadgeByName(supabase, userId, "First Step");
      awardResults.push({ badge: "First Step", awarded: result });
    }

    // Document badges
    if (docCount >= 10) {
      const result = await awardBadgeByName(supabase, userId, "Document Guru");
      awardResults.push({ badge: "Document Guru", awarded: result });
    }
    if (docCount >= 20) {
      const result = await awardBadgeByName(supabase, userId, "Document Pro");
      awardResults.push({ badge: "Document Pro", awarded: result });
    }

    // Audio badges
    if (audioCount >= 5) {
      const result = await awardBadgeByName(supabase, userId, "Audio Enthusiast");
      awardResults.push({ badge: "Audio Enthusiast", awarded: result });
    }
    if (audioCount >= 15) {
      const result = await awardBadgeByName(supabase, userId, "Audio Analyzer");
      awardResults.push({ badge: "Audio Analyzer", awarded: result });
    }

    // Text summarization badges
    if (textCount >= 10) {
      const result = await awardBadgeByName(supabase, userId, "Summarization Star");
      awardResults.push({ badge: "Summarization Star", awarded: result });
    }
    if (textCount >= 20) {
      const result = await awardBadgeByName(supabase, userId, "Knowledge Seeker");
      awardResults.push({ badge: "Knowledge Seeker", awarded: result });
    }

    // Question badges
    if (questionCount >= 20) {
      const result = await awardBadgeByName(supabase, userId, "Curious Learner");
      awardResults.push({ badge: "Curious Learner", awarded: result });
    }

    // Check badge count for Badge Collector and Super Collector
    await checkBadgeCollectorAchievement(supabase, userId, awardResults);

    return awardResults;
  } catch (error) {
    console.error('Error in badge checking logic:', error);
    return [];
  }
}

// Get count of a specific activity type
async function getActivityCount(supabase: SupabaseClient, userId: string, activityType: string): Promise<number> {
  const { count, error } = await supabase
    .from('user_activities')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('activity_type', activityType);

  if (error) {
    console.error(`Error counting ${activityType} activities:`, error);
    return 0;
  }

  return count || 0;
}

// Award a badge by name
async function awardBadgeByName(supabase: SupabaseClient, userId: string, badgeName: string): Promise<boolean> {
  try {
    console.log(`Checking if user ${userId} should receive badge: ${badgeName}`);

    // Get badge ID
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('id')
      .eq('name', badgeName)
      .single();

    if (badgeError || !badge) {
      console.error(`Badge "${badgeName}" not found:`, badgeError);
      return false;
    }

    // Check if user already has this badge
    const { data: existingBadge, error: existingError } = await supabase
      .from('user_badges')
      .select('id, is_earned')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single();

    const now = new Date().toISOString();

    if (existingError || !existingBadge) {
      // Badge doesn't exist for user yet, create it
      console.log(`Awarding new badge "${badgeName}" to user ${userId}`);
      const { error: insertError } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
          is_earned: true,
          progress: 100,
          earned_at: now,
          notification_shown: false
        });

      if (insertError) {
        console.error(`Error creating badge "${badgeName}":`, insertError);
        return false;
      }
      return true;
    } else if (!existingBadge.is_earned) {
      // Badge exists but not earned yet
      console.log(`Updating badge "${badgeName}" for user ${userId} to earned`);
      const { error: updateError } = await supabase
        .from('user_badges')
        .update({
          is_earned: true,
          progress: 100,
          earned_at: now,
          notification_shown: false
        })
        .eq('id', existingBadge.id);

      if (updateError) {
        console.error(`Error updating badge "${badgeName}":`, updateError);
        return false;
      }
      return true;
    }

    return false; // Badge already earned
  } catch (error) {
    console.error(`Error in awardBadgeByName for ${badgeName}:`, error);
    return false;
  }
}

// Check for badge collector achievements
async function checkBadgeCollectorAchievement(supabase: SupabaseClient, userId: string, awardResults: AwardResult[]) {
  try {
    // Count earned badges
    const { count, error } = await supabase
      .from('user_badges')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_earned', true);

    if (error) {
      console.error('Error counting badges:', error);
      return;
    }

    const badgeCount = count || 0;
    console.log(`User ${userId} has ${badgeCount} badges`);

    // Award collector badges
    if (badgeCount >= 5) {
      const result = await awardBadgeByName(supabase, userId, "Badge Collector");
      awardResults.push({ badge: "Badge Collector", awarded: result });
    }

    if (badgeCount >= 10) {
      const result = await awardBadgeByName(supabase, userId, "Super Collector");
      awardResults.push({ badge: "Super Collector", awarded: result });
    }

    // Check for Ultimate Learner badge
    const { count: totalBadges, error: badgeError } = await supabase
      .from('badges')
      .select('*', { count: 'exact', head: true })
      .neq('name', 'Ultimate Learner');

    if (!badgeError && totalBadges && badgeCount >= totalBadges - 1) {
      const result = await awardBadgeByName(supabase, userId, "Ultimate Learner");
      awardResults.push({ badge: "Ultimate Learner", awarded: result });
    }
  } catch (error) {
    console.error('Error checking badge collector achievements:', error);
  }
}