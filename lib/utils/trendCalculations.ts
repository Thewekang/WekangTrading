/**
 * Trend Calculation Utilities
 * Pure functions for calculating moving averages and trend indicators
 * Safe for client-side use (no database imports)
 */

export interface DailyTrend {
  date: string;
  winRate: number;
  sopRate: number;
  profitLoss: number;
  totalTrades: number;
  totalWins: number;
  totalSopFollowed: number;
}

export interface MovingAverageData {
  date: string;
  value: number;
  ma7: number | null;
  ma30: number | null;
}

export function calculateMovingAverages(
  data: DailyTrend[],
  metric: 'winRate' | 'sopRate' | 'profitLoss'
): MovingAverageData[] {
  return data.map((item, index) => {
    // Calculate 7-day moving average
    let ma7: number | null = null;
    if (index >= 6) {
      const last7 = data.slice(index - 6, index + 1);
      const sum7 = last7.reduce((sum, d) => sum + d[metric], 0);
      ma7 = Math.round((sum7 / 7) * 10) / 10;
    }

    // Calculate 30-day moving average
    let ma30: number | null = null;
    if (index >= 29) {
      const last30 = data.slice(index - 29, index + 1);
      const sum30 = last30.reduce((sum, d) => sum + d[metric], 0);
      ma30 = Math.round((sum30 / 30) * 10) / 10;
    }

    return {
      date: item.date,
      value: item[metric],
      ma7,
      ma30,
    };
  });
}
