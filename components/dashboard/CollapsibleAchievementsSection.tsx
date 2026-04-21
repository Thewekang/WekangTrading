'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { AchievementShowcase } from '@/components/dashboard/AchievementShowcase';
import { ActiveStreaksWidget } from '@/components/dashboard/ActiveStreaksWidget';
import { NextBadgesProgress } from '@/components/dashboard/NextBadgesProgress';
import { MotivationalMessagesFeed } from '@/components/dashboard/MotivationalMessagesFeed';

export function CollapsibleAchievementsSection({ accountId }: { accountId: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="mb-6">
      {/* Section Header - Collapsible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors mb-4"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">🏆 Achievements & Progress</span>
          <span className="text-sm text-gray-500">(Recent achievements, streaks, and updates)</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="space-y-6">
          {/* Achievement Showcase */}
          <div>
            <AchievementShowcase limit={4} accountId={accountId} />
          </div>

          {/* Gamification Widgets Row */}
          <div className="grid gap-6 lg:grid-cols-3">
            <ActiveStreaksWidget accountId={accountId} />
            <NextBadgesProgress limit={3} accountId={accountId} />
            <MotivationalMessagesFeed limit={5} />
          </div>
        </div>
      )}
    </div>
  );
}
