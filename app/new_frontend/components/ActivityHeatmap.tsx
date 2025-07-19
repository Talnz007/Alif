'use client';

import { useEffect, useState } from 'react';
import { Chart as ChartJS, BarElement, LinearScale, CategoryScale, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useUser } from '@/hooks/use-user';

ChartJS.register(BarElement, LinearScale, CategoryScale, Tooltip, Legend);

interface TrendItem {
  date: string;
  count: number;
}

export default function ActivityHeatmap({ userId }: { userId: string }) {
  const { user, loading: userLoading } = useUser();
  const [trendData, setTrendData] = useState<TrendItem[]>([]);
  const [chartData, setChartData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        const res = await fetch(`/api/users/${userId}/activity-trend`);
        if (!res.ok) throw new Error('Failed to fetch activity trend data');
        const { trend } = await res.json();
        console.log("Trend data:", trend); // Debug log
        if (!Array.isArray(trend)) throw new Error('Invalid trend data format');
        setTrendData(trend);
      } catch (err) {
        setError((err as Error).message || 'An error occurred');
        setTrendData([]);
      }
    };
    fetchTrend();
  }, [userId]);

  useEffect(() => {
    if (trendData.length > 0) {
      console.log("Processed trend data:", trendData); // Debug processed data
      const dataMap: { [key: string]: number } = {};
      trendData.forEach(item => {
        dataMap[item.date] = item.count;
      });

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 180); // Last 6 months
      const dates = [];
      for (let d = new Date(startDate); d <= new Date(); d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        dates.push({
          x: dateStr,
          y: dataMap[dateStr] || 0,
        });
      }

      setChartData({
        datasets: [
          {
            label: 'Activity Heatmap',
            data: dates,
            backgroundColor: (context: any) => {
              const value = context.raw.y;
              return value > 0 ? `rgba(54, 162, 235, ${Math.min(value / 10, 1)})` : 'rgba(108, 117, 125, 0.2)';
            },
            borderColor: 'rgba(0, 0, 0, 0)',
            borderWidth: 1,
            barPercentage: 1.0,
            categoryPercentage: 1.0,
          },
        ],
      });
    }
  }, [trendData]);

  if (userLoading) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">Loading heatmap...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-500 dark:text-red-400">Error: {error}</p>;
  }

  if (!chartData || trendData.length === 0) {
    return <p className="text-sm text-gray-500 dark:text-gray-400">No activity data available.</p>;
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          displayFormats: { day: 'yyyy-MM-dd' },
          stepSize: 7,
        },
        title: { display: false },
        ticks: { display: false },
      },
      y: {
        type: 'category' as const,
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        title: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.raw.y} activities on ${context.raw.x}`,
        },
      },
      title: {
        display: true,
        text: `Activity Heatmap for ${user?.username || 'Guest'}`,
        font: { size: 16 },
        color: 'text-gray-900 dark:text-gray-100',
      },
    },
    height: 200,
  };

  return (
    <div className="h-64 p-2 bg-white dark:bg-gray-800" role="img" aria-label="Activity heatmap chart">
      <Bar data={chartData} options={options} />
    </div>
  );
}