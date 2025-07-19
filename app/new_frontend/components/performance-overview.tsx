'use client';

import { useEffect, useState } from 'react';

export default function PerformanceOverview({ userId }: { userId: string }) {
  const [stats, setStats] = useState({ averageScore: 0, totalQuizzes: 0, totalActivities: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch(`/api/assignments/stats?userId=${userId}`);
      const { averageScore, totalCompleted } = await res.json();
      const trendRes = await fetch(`/api/users/${userId}/activity-trend`);
      const { trend } = await trendRes.json();
      setStats({ averageScore, totalQuizzes: totalCompleted, totalActivities: trend.length });
    };
    fetchStats();
  }, [userId]);

  return (
    <div className="p-4 bg-gray-100 dark:bg-gray-800 text-black dark:text-white">
      <h2 className="text-xl font-bold">Overall Statistics</h2>
      <p>Average Quiz Score: {stats.averageScore}%</p>
      <p>Total Quizzes: {stats.totalQuizzes}</p>
      <p>Total Activities: {stats.totalActivities}</p>
    </div>
  );
}