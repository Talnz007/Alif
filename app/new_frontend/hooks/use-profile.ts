import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import useUser from './use-user';

export interface Badge {
  id: number;
  name: string;
  description: string;
  image_url: string;
  earned_at?: string;
}

export interface Streak {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

export interface Activity {
  id: number;
  activity_type: string;
  timestamp: string;
  metadata: any;
}

export interface ProfileData {
  id: string;
  username: string;
  email: string;
  created_at: string;
  total_points: number;
  streak?: Streak;
  badges: Badge[];
  activities: Activity[];
}

export default function useProfile() {
  const { user, loading: userLoading } = useUser();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!user || userLoading) return;
    setLoading(true);
    setError(null);

    const fetchProfile = async () => {
      try {
        // 1. Fetch user info
        const {data: userData, error: userError} = await supabase
            .from('users')
            .select('id, username, email, created_at, total_points, image_url')
            .eq('id', user.id)
            .single();
        if (userError) throw userError;

        // 2. Fetch streak
        const { data: streakData } = await supabase
          .from('user_streaks')
          .select('current_streak, longest_streak, last_activity_date')
          .eq('user_id', user.id)
          .single();

        // 3. Fetch earned badges
        const { data: badgesData } = await supabase
          .from('user_badges')
          .select('badge_id, earned_at, badges(id, name, description, image_url)')
          .eq('user_id', user.id)
          .eq('is_earned', true);
        const badges: Badge[] = (badgesData || []).map((ub: any) => ({
          id: ub.badges.id,
          name: ub.badges.name,
          description: ub.badges.description,
          image_url: ub.badges.image_url,
          earned_at: ub.earned_at,
        }));

        // 4. Fetch recent activities
        const { data: activitiesData } = await supabase
          .from('user_activities')
          .select('id, activity_type, timestamp, metadata')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(10);

        setProfile({
          ...userData,
          streak: streakData || undefined,
          badges,
          activities: activitiesData || [],
        });
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user, userLoading]);

  return { profile, loading: loading || userLoading, error };
} 