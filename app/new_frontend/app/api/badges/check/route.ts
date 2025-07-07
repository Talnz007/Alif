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

    // NEW: Check for streak-based badges
    await checkLoginStreakBadges(supabase, userId, awardResults);
    await checkStudyStreakBadges(supabase, userId, awardResults);

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

async function checkLoginStreakBadges(supabase: SupabaseClient, userId: string, awardResults: AwardResult[]) {
  try {
    // Get login activities ordered by date
    const { data: loginActivities, error } = await supabase
      .from('user_activities')
      .select('created_at')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .order('created_at', { ascending: true });

    if (error || !loginActivities || loginActivities.length === 0) {
      console.log('No login activities found or error:', error);
      return;
    }

    // Calculate consecutive days
    const consecutiveDays = calculateConsecutiveDays(loginActivities.map(a =>
      new Date(a.created_at)
    ));

    console.log(`User ${userId} has logged in for ${consecutiveDays} consecutive days`);

    // Award Daily Learner for 7+ consecutive days
    if (consecutiveDays >= 7) {
      const result = await awardBadgeByName(supabase, userId, "Daily Learner");
      awardResults.push({ badge: "Daily Learner", awarded: result });
    }

    // Award Consistent Learner for 30+ consecutive days
    if (consecutiveDays >= 30) {
      const result = await awardBadgeByName(supabase, userId, "Consistent Learner");
      awardResults.push({ badge: "Consistent Learner", awarded: result });
    }

    // Track the progress for these badges
    if (consecutiveDays > 0 && consecutiveDays < 7) {
      // Update Daily Learner progress
      await updateBadgeProgress(supabase, userId, "Daily Learner", Math.floor((consecutiveDays / 7) * 100));
    }

    if (consecutiveDays > 0 && consecutiveDays < 30) {
      // Update Consistent Learner progress
      await updateBadgeProgress(supabase, userId, "Consistent Learner", Math.floor((consecutiveDays / 30) * 100));
    }

  } catch (error) {
    console.error('Error checking login streak badges:', error);
  }
}

// NEW: Check study streak badges
async function checkStudyStreakBadges(supabase: SupabaseClient, userId: string, awardResults: AwardResult[]) {
  try {
    // Get study session activities ordered by date
    const { data: studyActivities, error } = await supabase
      .from('user_activities')
      .select('created_at')
      .eq('user_id', userId)
      .in('activity_type', ['study_session_start', 'study_session_end'])
      .order('created_at', { ascending: true });

    if (error || !studyActivities || studyActivities.length === 0) {
      console.log('No study activities found or error:', error);
      return;
    }

    // Calculate study streaks (days with study sessions)
    const studyDays = getUniqueDays(studyActivities.map(a => new Date(a.created_at)));
    const streakLength = calculateLongestStreak(studyDays);

    console.log(`User ${userId} has a study streak of ${streakLength} days`);

    // Award Streak Starter for 3+ day streak
    if (streakLength >= 3) {
      const result = await awardBadgeByName(supabase, userId, "Streak Starter");
      awardResults.push({ badge: "Streak Starter", awarded: result });
    }

    // Award Streak Master for 10+ day streak
    if (streakLength >= 10) {
      const result = await awardBadgeByName(supabase, userId, "Streak Master");
      awardResults.push({ badge: "Streak Master", awarded: result });
    }

    // Award Streak Specialist for 30+ day streak
    if (streakLength >= 30) {
      const result = await awardBadgeByName(supabase, userId, "Streak Specialist");
      awardResults.push({ badge: "Streak Specialist", awarded: result });
    }

    // Track progress for these badges
    if (streakLength > 0 && streakLength < 3) {
      await updateBadgeProgress(supabase, userId, "Streak Starter", Math.floor((streakLength / 3) * 100));
    }

    if (streakLength > 3 && streakLength < 10) {
      await updateBadgeProgress(supabase, userId, "Streak Master", Math.floor(((streakLength - 3) / 7) * 100));
    }

    if (streakLength > 10 && streakLength < 30) {
      await updateBadgeProgress(supabase, userId, "Streak Specialist", Math.floor(((streakLength - 10) / 20) * 100));
    }

  } catch (error) {
    console.error('Error checking study streak badges:', error);
  }
}
function calculateConsecutiveDays(dates: Date[]): number {
  if (!dates || dates.length === 0) return 0;

  // Sort dates and convert to days only
  const dateStrings = dates
    .map(d => d.toISOString().split('T')[0])
    .sort()
    .filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates

  if (dateStrings.length === 0) return 0;

  // Find the longest streak by checking consecutive days
  let currentStreak = 1;
  let maxStreak = 1;
  let yesterday = new Date(dateStrings[0]);

  for (let i = 1; i < dateStrings.length; i++) {
    const today = new Date(dateStrings[i]);
    const diffDays = Math.round((today.getTime() - yesterday.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      // Streak broken
      currentStreak = 1;
    }

    yesterday = today;
  }

  return maxStreak;
}

// NEW: Helper function to get unique days from a list of dates
function getUniqueDays(dates: Date[]): string[] {
  return [...new Set(dates.map(d => d.toISOString().split('T')[0]))].sort();
}

// NEW: Helper function to calculate the longest streak of consecutive days
function calculateLongestStreak(dateStrings: string[]): number {
  if (dateStrings.length === 0) return 0;

  let currentStreak = 1;
  let maxStreak = 1;

  for (let i = 1; i < dateStrings.length; i++) {
    const yesterday = new Date(dateStrings[i-1]);
    const today = new Date(dateStrings[i]);
    const diffDays = Math.round((today.getTime() - yesterday.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (diffDays > 1) {
      currentStreak = 1;
    }
  }

  return maxStreak;
}

// NEW: Helper function to update badge progress
async function updateBadgeProgress(
  supabase: SupabaseClient,
  userId: string,
  badgeName: string,
  progress: number
): Promise<void> {
  try {
    // Get badge ID
    const { data: badge, error: badgeError } = await supabase
      .from('badges')
      .select('id')
      .eq('name', badgeName)
      .single();

    if (badgeError || !badge) {
      console.error(`Badge "${badgeName}" not found:`, badgeError);
      return;
    }

    // Check if user already has this badge
    const { data: existingBadge, error: existingError } = await supabase
      .from('user_badges')
      .select('id, is_earned, progress')
      .eq('user_id', userId)
      .eq('badge_id', badge.id)
      .single();

    if (existingError && existingError.code === 'PGRST116') {
      // Badge doesn't exist for user yet, create it
      await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badge.id,
          is_earned: false,
          progress: progress,
          notification_shown: false
        });
    } else if (!existingError && !existingBadge.is_earned) {
      // Update progress only if not earned yet and new progress is higher
      if (existingBadge.progress < progress) {
        await supabase
          .from('user_badges')
          .update({ progress: progress })
          .eq('id', existingBadge.id);
      }
    }
  } catch (error) {
    console.error(`Error updating progress for badge ${badgeName}:`, error);
  }
}