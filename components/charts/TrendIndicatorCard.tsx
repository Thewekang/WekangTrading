/**
 * Trend Indicator Card Component
 * Shows metric trend with direction indicator
 */

'use client';

interface TrendIndicatorCardProps {
  metric: 'winRate' | 'sopRate' | 'profitLoss';
  metricLabel: string;
  direction: 'improving' | 'declining' | 'stable';
  changePercent: number;
  trend7Day: number;
  trend30Day: number;
  formatter?: (value: number) => string;
}

export default function TrendIndicatorCard({
  metric,
  metricLabel,
  direction,
  changePercent,
  trend7Day,
  trend30Day,
  formatter = (value) => value.toFixed(1),
}: TrendIndicatorCardProps) {
  const getDirectionIcon = () => {
    if (direction === 'improving') {
      return (
        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      );
    }
    if (direction === 'declining') {
      return (
        <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
        </svg>
      );
    }
    return (
      <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
      </svg>
    );
  };

  const getDirectionColor = () => {
    if (direction === 'improving') return 'text-green-600';
    if (direction === 'declining') return 'text-red-600';
    return 'text-gray-600';
  };

  const getDirectionBgColor = () => {
    if (direction === 'improving') return 'bg-green-50';
    if (direction === 'declining') return 'bg-red-50';
    return 'bg-gray-50';
  };

  return (
    <div className={`p-4 rounded-lg border ${getDirectionBgColor()}`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-sm font-medium text-gray-700">{metricLabel}</h3>
          <p className={`text-2xl font-bold ${getDirectionColor()} mt-1`}>
            {direction === 'improving' ? '↗' : direction === 'declining' ? '↘' : '→'} {metric === 'profitLoss' ? formatter(Math.abs(changePercent)) : `${Math.abs(changePercent)}%`}
          </p>
        </div>
        {getDirectionIcon()}
      </div>
      
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">7-Day Change:</span>
          <span className={`font-medium ${trend7Day > 0 ? 'text-green-600' : trend7Day < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {trend7Day > 0 ? '+' : ''}{formatter(trend7Day)}
            {metric !== 'profitLoss' && '%'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">30-Day Change:</span>
          <span className={`font-medium ${trend30Day > 0 ? 'text-green-600' : trend30Day < 0 ? 'text-red-600' : 'text-gray-600'}`}>
            {trend30Day > 0 ? '+' : ''}{formatter(trend30Day)}
            {metric !== 'profitLoss' && '%'}
          </span>
        </div>
      </div>
    </div>
  );
}
