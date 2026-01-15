/**
 * Next Badges Progress - Show progress towards earning next badges
 */

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/lib/db/schema';
import { BADGE_COLORS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface BadgeProgress {
  badge: Badge;
  progress: number;
  currentValue: number;
  targetValue: number;
}

export function NextBadgesProgress({ limit = 3 }: { limit?: number }) {
  const [badgeProgress, setBadgeProgress] = useState<BadgeProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBadgeProgress();
  }, []);

  async function fetchBadgeProgress() {
    try {
      const response = await fetch('/api/badges/progress');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // Get top N badges closest to earning
          setBadgeProgress(data.data.slice(0, limit));
        }
      }
    } catch (error) {
      console.error('Failed to fetch badge progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">🎯 Next Achievements</h2>
        <div className="animate-pulse text-gray-400">Loading progress...</div>
      </div>
    );
  }

  if (badgeProgress.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">🎯 Next Achievements</h2>
        <div className="text-center py-6 text-gray-500">
          <p className="text-3xl mb-2">🏆</p>
          <p className="text-sm">All badges earned!</p>
          <p className="text-xs mt-1">Amazing achievement!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🎯 Next Achievements</h2>
      
      <div className="space-y-4">
        {badgeProgress.map(({ badge, progress, currentValue, targetValue }) => {
          const tierColors = BADGE_COLORS[badge.tier as keyof typeof BADGE_COLORS];
          
          return (
            <div key={badge.id} className="space-y-2">
              {/* Badge Info */}
              <div className="flex items-center gap-3">
                <span className="text-2xl filter grayscale">{badge.icon}</span>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">{badge.name}</div>
                  <div className="text-xs text-gray-600">{badge.description}</div>
                </div>
                <span className={cn(
                  'text-xs font-bold px-2 py-1 rounded',
                  'bg-yellow-100 text-yellow-700'
                )}>
                  +{badge.points}
                </span>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{formatProgress(currentValue, targetValue, badge)}</span>
                  <span className="font-semibold text-gray-900">{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={cn(
                      'h-2.5 rounded-full transition-all',
                      tierColors.border.replace('border', 'bg')
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t text-center text-xs text-gray-600">
        You're on track to unlock {badgeProgress.length} more {badgeProgress.length === 1 ? 'badge' : 'badges'}!
      </div>
    </div>
  );
}

function formatProgress(current: number, target: number, badge: Badge): string {
  const requirement = JSON.parse(badge.requirement);
  
  switch (requirement.type) {
    case 'TOTAL_TRADES':
      return `${current} / ${target} trades`;
    case 'WIN_STREAK':
    case 'LOG_STREAK':
      return `${current} / ${target} days`;
    case 'SOP_STREAK':
      return `${current} / ${target} trades`;
    case 'PROFIT_TOTAL':
      return `$${current.toFixed(0)} / $${target}`;
    case 'WIN_RATE':
    case 'SOP_RATE':
      return `${current.toFixed(1)}% / ${target}%`;
    case 'SESSION_TRADES':
      return `${current} / ${target} ${requirement.sessionType} trades`;
    case 'MAX_TRADES_DAY':
      return `${current} / ${target} trades/day`;
    case 'TOTAL_LOGGING_DAYS':
      return `${current} / ${target} logging days`;
    default:
      return `${current} / ${target}`;
  }
}
