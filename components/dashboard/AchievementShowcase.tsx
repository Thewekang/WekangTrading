/**
 * Achievement Showcase - Display recent earned badges on dashboard
 */

'use client';

import { useEffect, useState } from 'react';
import { BadgeCard } from '@/components/badges/BadgeCard';
import { Badge, UserBadge } from '@/lib/db/schema';
import Link from 'next/link';

interface AchievementShowcaseProps {
  limit?: number;
}

export function AchievementShowcase({ limit = 4 }: AchievementShowcaseProps) {
  const [recentBadges, setRecentBadges] = useState<Array<{ badge: Badge; userBadge: UserBadge }>>([]);
  const [totalBadges, setTotalBadges] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentBadges();
  }, [limit]);

  async function fetchRecentBadges() {
    try {
      const response = await fetch('/api/badges/user');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Get recent badges (already sorted by earnedAt desc from API)
          const recent = data.data.badges.slice(0, limit);
          setRecentBadges(recent);
          setTotalBadges(data.data.totalBadges);
        }
      }
    } catch (error) {
      console.error('Failed to fetch badges:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">🏆 Recent Achievements</h2>
        </div>
        <div className="flex gap-4 justify-center items-center h-32">
          <div className="animate-pulse text-gray-400">Loading badges...</div>
        </div>
      </div>
    );
  }

  if (recentBadges.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">🏆 Recent Achievements</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          <p className="text-4xl mb-2">🎯</p>
          <p>No badges earned yet</p>
          <p className="text-sm mt-1">Start trading to unlock achievements!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">🏆 Recent Achievements</h2>
        <Link
          href="/dashboard/achievements"
          className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
        >
          View All {totalBadges} Badges →
        </Link>
      </div>
      
      {/* Badge Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentBadges.map(({ badge, userBadge }) => (
          <BadgeCard
            key={userBadge.id}
            badge={badge}
            earned={true}
            earnedAt={userBadge.earnedAt}
            size="md"
            showProgress={false}
          />
        ))}
      </div>
      
      {/* Stats */}
      <div className="mt-4 pt-4 border-t flex justify-between text-sm text-gray-600">
        <span>Total Badges: <strong className="text-gray-900">{totalBadges}</strong></span>
        <span>Keep going to unlock more!</span>
      </div>
    </div>
  );
}
