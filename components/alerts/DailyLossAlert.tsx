'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';

interface DailyLossAlertProps {
  className?: string;
}

export default function DailyLossAlert({ className = '' }: DailyLossAlertProps) {
  const [lossData, setLossData] = useState<{
    lossesToday: number;
    limitReached: boolean;
    remainingLosses: number;
    todayResults: {
      wins: number;
      losses: number;
      total: number;
    };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDailyLosses();
  }, []);

  const checkDailyLosses = async () => {
    try {
      const response = await fetch('/api/daily-loss-check');
      const result = await response.json();
      
      if (result.success) {
        setLossData(result.data);
      }
    } catch (error) {
      console.error('Error checking daily losses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function for parent components
  useEffect(() => {
    (window as any).refreshDailyLossAlert = checkDailyLosses;
    return () => {
      delete (window as any).refreshDailyLossAlert;
    };
  }, []);

  if (loading || !lossData) return null;

  // Don't show anything if no losses today
  if (lossData.lossesToday === 0) return null;

  // Show critical alert if limit reached
  if (lossData.limitReached) {
    return (
      <Card className={`p-4 bg-red-50 border-2 border-red-500 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="text-3xl">🛑</div>
          <div className="flex-1">
            <h3 className="font-bold text-red-900 text-lg mb-1">
              ⚠️ DAILY LOSS LIMIT REACHED - STOP TRADING!
            </h3>
            <p className="text-red-800 mb-2">
              You have reached the maximum of <strong>2 losses</strong> for today as per your SOP.
            </p>
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 mb-2">
              <div className="font-semibold text-red-900 mb-1">Today's Results:</div>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-red-700">Losses: </span>
                  <span className="font-bold text-red-900">{lossData.lossesToday}</span>
                </div>
                <div>
                  <span className="text-green-700">Wins: </span>
                  <span className="font-bold text-green-900">{lossData.todayResults.wins}</span>
                </div>
                <div>
                  <span className="text-gray-700">Total: </span>
                  <span className="font-bold text-gray-900">{lossData.todayResults.total}</span>
                </div>
              </div>
            </div>
            <p className="text-sm text-red-700 font-medium">
              📋 <strong>SOP Reminder:</strong> Take a break, review your strategy, and come back tomorrow with a fresh mindset.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Show warning if 1 loss (approaching limit)
  if (lossData.lossesToday === 1) {
    return (
      <Card className={`p-4 bg-yellow-50 border-2 border-yellow-400 ${className}`}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">⚠️</div>
          <div className="flex-1">
            <h3 className="font-bold text-yellow-900 text-base mb-1">
              Warning: 1 Loss Today - Trade Carefully
            </h3>
            <p className="text-yellow-800 text-sm mb-2">
              You have <strong>1 more loss</strong> remaining before hitting your daily limit (2 losses max per SOP).
            </p>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-red-600">Losses: </span>
                  <span className="font-bold text-red-700">{lossData.lossesToday}</span>
                </div>
                <div>
                  <span className="text-green-600">Wins: </span>
                  <span className="font-bold text-green-700">{lossData.todayResults.wins}</span>
                </div>
                <div>
                  <span className="text-yellow-600">Remaining: </span>
                  <span className="font-bold text-yellow-700">{lossData.remainingLosses}</span>
                </div>
              </div>
            </div>
            <p className="text-xs text-yellow-700 mt-2">
              💡 Consider reviewing your next trade setup carefully before entering.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return null;
}
