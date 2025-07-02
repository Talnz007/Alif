import { supabase } from '@/lib/supabase';
import { ActivityType, ActivityMetadata } from '@/lib/utils/activity-types';



/**
 * Log a user activity with optional metadata
 */
export async function trackActivity(
    userId: string,
    activityType: ActivityType | string,
    metadata?: ActivityMetadata
): Promise<boolean> {
  try {
    // Insert the activity into the database
    const { error } = await supabase
        .from('user_activities')
        .insert({
          user_id: userId,
          activity_type: activityType,
          metadata
        });

    if (error) {
      console.error('Error logging activity:', error);
      return false;
    }

    // For login activity, check login streak
    if (activityType === ActivityType.LOGIN) {
      await checkLoginStreak(userId);
    }

    // For certain activities, check for badges and update streaks
    if (isStreakActivity(activityType)) {
      await updateStreak(userId);
      await checkForBadges(userId, activityType, metadata);
    }

    // For document/audio/summarization activities
    if ([ActivityType.DOCUMENT_UPLOADED, ActivityType.AUDIO_UPLOADED, ActivityType.TEXT_SUMMARIZED].includes(activityType as ActivityType)) {
      await checkContentBadges(userId, activityType as ActivityType);
    }

    // For goal activities
    if ([ActivityType.GOAL_SET, ActivityType.GOAL_COMPLETED].includes(activityType as ActivityType)) {
      await checkGoalBadges(userId, activityType as ActivityType);
    }

    // For question activities
    if (activityType === ActivityType.QUESTION_ASKED) {
      await checkQuestionBadges(userId);
    }

    return true;
  } catch (error) {
    console.error("Error tracking activity:", error);
    return false;
  }
}

/**
 * Award points to a user for an activity
 */
export async function awardPoints(
  userId: string,
  points: number,
  reason: string,
  metadata?: ActivityMetadata
): Promise<number> {
  try {
    // First, log the points transaction
    const { error: insertError } = await supabase
      .from('user_points')
      .insert({
        user_id: userId,
        points,
        reason,
        metadata
      });

    if (insertError) {
      console.error('Error recording points transaction:', insertError);
      throw insertError;
    }

    // Get the user's current points
    const { data: userData, error: selectError } = await supabase
      .from('users')
      .select('total_points')
      .eq('id', userId)
      .single();

    if (selectError) {
      console.error('Error getting user points:', selectError);
      throw selectError;
    }

    const currentPoints = userData?.total_points || 0;
    const newTotal = currentPoints + points;

    // Update the user's total points
    const { error: updateError } = await supabase
      .from('users')
      .update({ total_points: newTotal })
      .eq('id', userId);

    if (updateError) {
      console.error('Error updating user points:', updateError);
      throw updateError;
    }

    // Check leaderboard position after points update
    await checkLeaderboardBadges(userId);

    return newTotal;
  } catch (error) {
    console.error("Error awarding points:", error);
    throw error;
  }
  return 0;
}

/**
 * Calculate points for assignment completion based on score and difficulty
 */
export function calculateAssignmentPoints(score: number, difficulty: string = 'medium'): number {
  // Base points from score (0-100)
  let points = score;

  // Multiply by difficulty factor
  switch (difficulty.toLowerCase()) {
    case 'easy':
      points = Math.round(points * 0.8);
      break;
    case 'medium':
      // No multiplier for medium
      break;
    case 'hard':
      points = Math.round(points * 1.5);
      break;
    case 'expert':
      points = Math.round(points * 2);
      break;
  }

  return points;
}

/**
 * Check if an activity contributes to the user's streak
 */
export function isStreakActivity(activityType: ActivityType | string): boolean {
  return [
    ActivityType.ASSIGNMENT_COMPLETED,
    ActivityType.QUIZ_COMPLETED,
    ActivityType.STUDY_SESSION_END,
    ActivityType.LOGIN
  ].includes(activityType as ActivityType);
}

/**
 * Check user's login streak for badges
 */
async function checkLoginStreak(userId: string): Promise<void> {
  try {
    // Get login history
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { data: loginData, error: loginError } = await supabase
      .from('user_activities')
      .select('timestamp')
      .eq('user_id', userId)
      .eq('activity_type', 'login')
      .order('timestamp', { ascending: false });

    if (loginError) {
      console.error('Error fetching login data:', loginError);
      return;
    }

    // Calculate consecutive login days
    let consecutiveDays = 0;
    let previousDate: Date | null = null;

    if (loginData && loginData.length > 0) {
      for (const login of loginData) {
        const loginDate = new Date(login.timestamp);
        loginDate.setUTCHours(0, 0, 0, 0);

        if (!previousDate) {
          previousDate = loginDate;
          consecutiveDays = 1;
          continue;
        }

        const diffDays = Math.floor((previousDate.getTime() - loginDate.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          consecutiveDays++;
          previousDate = loginDate;
        } else {
          break; // Break the streak
        }
      }
    }

    // Check for badges
    if (consecutiveDays >= 7) {
      await awardBadgeByName(userId, "Daily Learner");
    }

    if (consecutiveDays >= 30) {
      await awardBadgeByName(userId, "Consistent Learner");
    }
  } catch (error) {
    console.error("Error checking login streak:", error);
  }
}

/**
 * Update the user's streak based on their recent activities
 */
async function updateStreak(userId: string): Promise<void> {
  try {
    // Get the current date in UTC
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Check if user has already completed an activity today
    const { data: todayActivities, error: todayError } = await supabase
      .from('user_activities')
      .select('id')
      .eq('user_id', userId)
      .in('activity_type', ['assignment_completed', 'quiz_completed', 'study_session_end'])
      .gte('timestamp', today.toISOString())
      .lt('timestamp', tomorrow.toISOString()); // Fixed this line!

    if (todayError) {
      console.error('Error checking today activities:', todayError);
      return;
    }

    const hasTodayActivity = todayActivities && todayActivities.length > 0;

    // Get user's last activity date before today
    const yesterday = new Date(today);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const { data: lastActivities, error: lastError } = await supabase
      .from('user_activities')
      .select('timestamp')
      .eq('user_id', userId)
      .in('activity_type', ['assignment_completed', 'quiz_completed', 'study_session_end'])
      .lt('timestamp', today.toISOString())
      .order('timestamp', { ascending: false })
      .limit(1);

    if (lastError) {
      console.error('Error getting last activity:', lastError);
      return;
    }

    // Get current streak data
    const { data: streakData, error: streakError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', userId);

    if (streakError) {
      console.error('Error getting streak data:', streakError);
      return;
    }

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let streakId = null;

    if (streakData && streakData.length > 0) {
      currentStreak = streakData[0].current_streak;
      longestStreak = streakData[0].longest_streak;
      streakId = streakData[0].id;
    }

    if (hasTodayActivity) {
      // First check if yesterday had activity
      if (lastActivities && lastActivities.length > 0) {
        const lastActivityDate = new Date(lastActivities[0].timestamp);
        lastActivityDate.setUTCHours(0, 0, 0, 0);

        // If last activity was yesterday, increment streak
        if (lastActivityDate.getTime() === yesterday.getTime()) {
          currentStreak++;
        } else {
          // Reset streak to 1 (today)
          currentStreak = 1;
        }
      } else {
        // First activity, streak is 1
        currentStreak = 1;
      }
    }

    // Update longest streak if needed
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Update or insert streak record
    if (streakId) {
      const { error: updateError } = await supabase
        .from('user_streaks')
        .update({
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: hasTodayActivity ? new Date().toISOString() : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', streakId);

      if (updateError) {
        console.error('Error updating streak:', updateError);
      }
    } else {
      const { error: insertError } = await supabase
        .from('user_streaks')
        .insert({
          user_id: userId,
          current_streak: currentStreak,
          longest_streak: longestStreak,
          last_activity_date: hasTodayActivity ? new Date().toISOString() : null
        });

      if (insertError) {
        console.error('Error creating streak record:', insertError);
      }
    }

    // Check for streak badges if streak is valid
    if (currentStreak >= 3) {
      await awardBadgeByName(userId, "Streak Starter");
    }

    if (currentStreak >= 10) {
      await awardBadgeByName(userId, "Streak Master");
    }

    if (currentStreak >= 30) {
      await awardBadgeByName(userId, "Streak Specialist");
    }
  } catch (error) {
    console.error("Error updating streak:", error);
  }
}

/**
 * Check content-related badges (documents, audio, summaries)
 */
async function checkContentBadges(userId: string, activityType: ActivityType): Promise<void> {
  try {
    // Count activities by type
    const counts = await Promise.all([
      // Summarizations
      supabase
        .from('user_activities')
        .select('count')
        .eq('user_id', userId)
        .eq('activity_type', ActivityType.TEXT_SUMMARIZED),

      // Audio files
      supabase
        .from('user_activities')
        .select('count')
        .eq('user_id', userId)
        .eq('activity_type', ActivityType.AUDIO_UPLOADED),

      // Documents
      supabase
        .from('user_activities')
        .select('count')
        .eq('user_id', userId)
        .eq('activity_type', ActivityType.DOCUMENT_UPLOADED)
    ]);

    const summarizationCount = (counts[0].data?.length || 0);
    const audioCount = (counts[1].data?.length || 0);
    const documentCount = (counts[2].data?.length || 0);

    // Check for summarization badges
    if (summarizationCount >= 10) {
      await awardBadgeByName(userId, "Summarization Star");
    }

    if (summarizationCount >= 20) {
      await awardBadgeByName(userId, "Knowledge Seeker");
    }

    // Check for audio badges
    if (audioCount >= 5) {
      await awardBadgeByName(userId, "Audio Enthusiast");
    }

    if (audioCount >= 15) {
      await awardBadgeByName(userId, "Audio Analyzer");
    }

    // Check for document badges
    if (documentCount >= 10) {
      await awardBadgeByName(userId, "Document Guru");
    }

    if (documentCount >= 20) {
      await awardBadgeByName(userId, "Document Pro");
    }

  } catch (error) {
    console.error("Error checking content badges:", error);
  }
}

/**
 * Check goal-related badges
 */
async function checkGoalBadges(userId: string, activityType: ActivityType): Promise<void> {
  try {
    if (activityType === ActivityType.GOAL_SET) {
      // Award badge for setting first goal
      await awardBadgeByName(userId, "Goal Setter");
    }

    if (activityType === ActivityType.GOAL_COMPLETED) {
      // Award badge for completing a goal
      await awardBadgeByName(userId, "Goal Achiever");
    }
  } catch (error) {
    console.error("Error checking goal badges:", error);
  }
}

/**
 * Check question badges
 */
async function checkQuestionBadges(userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('user_activities')
      .select('count')
      .eq('user_id', userId)
      .eq('activity_type', ActivityType.QUESTION_ASKED);

    if (error) {
      console.error('Error counting questions:', error);
      return;
    }

    const questionCount = data?.length || 0;

    if (questionCount >= 20) {
      await awardBadgeByName(userId, "Curious Learner");
    }
  } catch (error) {
    console.error("Error checking question badges:", error);
  }
}

/**
 * Check leaderboard position badges
 */
async function checkLeaderboardBadges(userId: string): Promise<void> {
  try {
    // Get user's rank
    const { data: users, error } = await supabase
      .from('users')
      .select('id, total_points')
      .order('total_points', { ascending: false });

    if (error) {
      console.error('Error getting users for leaderboard:', error);
      return;
    }

    // Find user's position
    const userIndex = users ? users.findIndex(u => u.id === userId) : -1;

    if (userIndex >= 0) {
      // User is on leaderboard
      await awardBadgeByName(userId, "Leaderboard Rookie");

      // Check if in top 10%
      const topPercentage = (userIndex / users!.length) * 100;
      if (topPercentage <= 10) {
        await awardBadgeByName(userId, "Top Performer");
      }
    }
  } catch (error) {
    console.error("Error checking leaderboard badges:", error);
  }
}

/**
 * Check if user has earned any new badges based on activity
 */

async function checkForBadges(
  userId: string,
  activityType: ActivityType | string,
  metadata?: ActivityMetadata
): Promise<void> {
  try {
    // Check badge count for Badge Collector and Super Collector
    await checkBadgeCollectorAchievement(userId);

    // For assignment-related activities, assign points and achievements
    if (activityType === ActivityType.ASSIGNMENT_COMPLETED && metadata?.score) {
      // If they have a perfect score on an assignment
      if (metadata.score >= 100) {
        // Check for assignment-specific achievements
      }
    }
  } catch (error) {
    console.error("Error checking for badges:", error);
  }
}

/**
 * Check for badge collector achievements
 */
async function checkBadgeCollectorAchievement(userId: string): Promise<void> {
  try {
    // Count earned badges
    const { data, error } = await supabase
      .from('user_badges')
      .select('id')
      .eq('user_id', userId)
      .eq('is_earned', true);

    if (error) {
      console.error('Error counting badges:', error);
      return;
    }

    const badgeCount = data?.length || 0;

    // Award badge collector badges
    if (badgeCount >= 5) {
      await awardBadgeByName(userId, "Badge Collector");
    }

    if (badgeCount >= 10) {
      await awardBadgeByName(userId, "Super Collector");
    }

    // Check if all badges are earned except Ultimate Learner
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('id')
      .neq('name', 'Ultimate Learner');

    if (badgesError) {
      console.error('Error fetching all badges:', badgesError);
      return;
    }

    if (allBadges && badgeCount >= allBadges.length - 1) {
      await awardBadgeByName(userId, "Ultimate Learner");
    }
  } catch (error) {
    console.error("Error checking badge collector achievement:", error);
  }
}

/**
 * Award a badge to a user by badge name
 */
async function awardBadgeByName(userId: string, badgeName: string): Promise<void> {
  try {
    // Find the badge ID by name
    const { data: badgeData, error: badgeError } = await supabase
      .from('badges')
      .select('id')
      .eq('name', badgeName)
      .single();

    if (badgeError) {
      console.error(`Badge "${badgeName}" not found:`, badgeError);
      return;
    }

    const badgeId = badgeData.id;

    // Check if user already has this badge
    const { data: userBadgeData, error: userBadgeError } = await supabase
      .from('user_badges')
      .select('id, is_earned')
      .eq('user_id', userId)
      .eq('badge_id', badgeId);

    if (userBadgeError) {
      console.error('Error checking user badge:', userBadgeError);
      return;
    }

    const now = new Date().toISOString();

    if (userBadgeData && userBadgeData.length > 0) {
      // If badge exists but not earned, update it
      if (!userBadgeData[0].is_earned) {
        const { error: updateError } = await supabase
          .from('user_badges')
          .update({
            progress: 100,
            is_earned: true,
            earned_at: now,
            updated_at: now
          })
          .eq('id', userBadgeData[0].id);

        if (updateError) {
          console.error('Error updating badge:', updateError);
        } else {
          console.log(`Badge "${badgeName}" updated for user ${userId}`);
          // After awarding a badge, check for collector badges
          await checkBadgeCollectorAchievement(userId);
        }
      }
    } else {
      // Insert new badge entry
      const { error: insertError } = await supabase
        .from('user_badges')
        .insert({
          user_id: userId,
          badge_id: badgeId,
          progress: 100,
          is_earned: true,
          earned_at: now,
          created_at: now,
          updated_at: now
        });

      if (insertError) {
        console.error('Error inserting badge:', insertError);
      } else {
        console.log(`Badge "${badgeName}" awarded to user ${userId}`);
        // After awarding a badge, check for collector badges
        await checkBadgeCollectorAchievement(userId);
      }
    }
  } catch (error) {
    console.error(`Error awarding badge ${badgeName} to user ${userId}:`, error);
  }
}