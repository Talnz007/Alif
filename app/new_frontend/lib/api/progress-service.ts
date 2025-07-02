// Progress and achievements API service

interface ProgressData {
  overallProgress: number;
  studyStreak: number;
  timeSpentHours: number;
  topSubjects: {
    name: string;
    progress: number;
  }[];
}

interface StreakData {
  current: number;
  longest: number;
  todayCompleted: boolean;
  weeklyProgress: number;
  level: "bronze" | "silver" | "gold" | "platinum";
  nextMilestone: number;
}

// Modified to match your existing badge structure
interface Badge {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
  is_earned: boolean;
  progress: number;
  earned_at?: string;
  category: string;
}

interface LeaderboardUser {
  id: string;
  name: string;
  score: number;
  avatar: string;
  rank?: number;
}

export async function getUserProgress(userId: string): Promise<ProgressData> {
  try {
    const response = await fetch(`/api/users/${userId}/progress`);
    if (!response.ok) throw new Error('Failed to fetch progress data');
    return response.json();
  } catch (error) {
    console.error('Error fetching progress:', error);
    return {
      overallProgress: 75,
      studyStreak: 7,
      timeSpentHours: 12.5,
      topSubjects: [
        { name: 'Mathematics', progress: 85 },
        { name: 'Physics', progress: 78 },
        { name: 'Computer Science', progress: 92 }
      ]
    };
  }
}

export async function getUserStreak(userId: string): Promise<StreakData> {
  try {
    const response = await fetch(`/api/users/${userId}/streak`);
    if (!response.ok) throw new Error('Failed to fetch streak data');
    return response.json();
  } catch (error) {
    console.error('Error fetching streak data:', error);
    return {
      current: 7,
      longest: 14,
      todayCompleted: true,
      weeklyProgress: 70,
      level: "silver",
      nextMilestone: 10
    };
  }
}

// Updated to work with your existing badge structure
export async function getUserBadges(userId: string, showAll: boolean = false): Promise<Badge[]> {
  try {
    const url = `/api/badges?userId=${userId}${showAll ? '&showAll=true' : ''}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch badges');
    const data = await response.json();
    console.log(`Fetched ${data.length} badges for user ${userId}`);
    return data;
  } catch (error) {
    console.error('Error fetching badges:', error);
    return [];
  }
}

export async function checkAndAwardBadges(userId: string, activityType: string, metadata: any = {}) {
  try {
    const response = await fetch(`/api/users/${userId}/badges/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        activityType,
        metadata
      })
    });

    if (!response.ok) throw new Error('Failed to check badges');
    return response.json();
  } catch (error) {
    console.error('Error checking badges:', error);
    return { success: false, newBadges: [] };
  }
}

export async function getRecentBadges(userId: string, limit: number = 3): Promise<Badge[]> {
  try {
    const response = await fetch(`/api/badges?userId=${userId}&recent=true&limit=${limit}`);
    if (!response.ok) throw new Error('Failed to fetch recent badges');
    return response.json();
  } catch (error) {
    console.error('Error fetching recent badges:', error);
    return [];
  }
}

export async function getLeaderboard(type: 'global' | 'local' | 'friends'): Promise<LeaderboardUser[]> {
  try {
    const response = await fetch(`/api/leaderboard?type=${type}`);
    if (!response.ok) throw new Error('Failed to fetch leaderboard');
    return response.json();
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [
      { id: '1', name: 'John Doe', score: 1200, avatar: '/placeholder.svg?height=40&width=40' },
      { id: '2', name: 'Jane Smith', score: 1150, avatar: '/placeholder.svg?height=40&width=40' },
      { id: '3', name: 'Bob Johnson', score: 1100, avatar: '/placeholder.svg?height=40&width=40' },
      { id: '4', name: 'Alice Brown', score: 1050, avatar: '/placeholder.svg?height=40&width=40' },
      { id: '5', name: 'Charlie Davis', score: 1000, avatar: '/placeholder.svg?height=40&width=40' }
    ];
  }
}

export async function logActivity(userId: string, activityType: string): Promise<void> {
  try {
    await fetch('/api/activities/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId,
        activityType,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.error('Error logging activity:', error);
  }
}