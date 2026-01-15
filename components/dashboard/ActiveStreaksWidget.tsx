/**
 * Active Streaks Widget - Display current streaks on dashboard
 */

'use client';

import { useEffect, useState } from 'react';

interface StreakData {
  winStreak: { current: number; longest: number };
  logStreak: { current: number; longest: number };
  sopStreak: { current: number; longest: number };
}

export function ActiveStreaksWidget() {
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStreaks();
  }, []);

  async function fetchStreaks() {
    try {
      const response = await fetch('/api/streaks');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setStreaks(data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch streaks:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">🔥 Active Streaks</h2>
        <div className="animate-pulse text-gray-400">Loading streaks...</div>
      </div>
    );
  }

  if (!streaks) {
    return null;
  }

  const hasActiveStreak = streaks.winStreak.current > 0 || 
                          streaks.logStreak.current > 0 || 
                          streaks.sopStreak.current > 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-bold mb-4">🔥 Active Streaks</h2>
      
      {!hasActiveStreak ? (
        <div className="text-center py-6 text-gray-500">
          <p className="text-3xl mb-2">⏸️</p>
          <p className="text-sm">No active streaks</p>
          <p className="text-xs mt-1">Start trading to build streaks!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Win Streak */}
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔥</span>
              <div>
                <div className="font-semibold text-gray-900">Winning Days</div>
                <div className="text-xs text-gray-600">
                  Best: {streaks.winStreak.longest} days
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-orange-600">
                {streaks.winStreak.current}
              </div>
              <div className="text-xs text-gray-600">days</div>
            </div>
          </div>
          
          {/* Log Streak */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📝</span>
              <div>
                <div className="font-semibold text-gray-900">Logging Streak</div>
                <div className="text-xs text-gray-600">
                  Best: {streaks.logStreak.longest} days
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {streaks.logStreak.current}
              </div>
              <div className="text-xs text-gray-600">days</div>
            </div>
          </div>
          
          {/* SOP Streak */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <div className="font-semibold text-gray-900">SOP Compliance</div>
                <div className="text-xs text-gray-600">
                  Best: {streaks.sopStreak.longest} trades
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {streaks.sopStreak.current}
              </div>
              <div className="text-xs text-gray-600">trades</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Motivation */}
      {hasActiveStreak && (
        <div className="mt-4 pt-4 border-t text-center text-sm text-gray-600">
          <p className="font-medium">Keep the momentum going! 💪</p>
        </div>
      )}
    </div>
  );
}
