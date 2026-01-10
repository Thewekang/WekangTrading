'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface DailyPerformance {
  date: number;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  totalSopFollowed: number;
  profitLoss: number;
  winRate: number;
  sopRate: number;
}

interface MonthlyPerformance {
  month: number;
  monthName: string;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  totalSopFollowed: number;
  profitLoss: number;
  winRate: number;
  sopRate: number;
}

interface PerformanceSummary {
  profitLoss: number;
  totalTrades: number;
  totalWins: number;
  totalLosses: number;
  totalSopFollowed: number;
  winRate: number;
  sopRate: number;
}

interface Props {
  userId: string;
  userName: string;
}

export default function UserPerformanceCalendar({ userId, userName }: Props) {
  const [view, setView] = useState<'month' | 'year'>('year');
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [dailyPerformance, setDailyPerformance] = useState<DailyPerformance[]>([]);
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([]);
  const [summary, setSummary] = useState<PerformanceSummary>({
    profitLoss: 0,
    totalTrades: 0,
    totalWins: 0,
    totalLosses: 0,
    totalSopFollowed: 0,
    winRate: 0,
    sopRate: 0
  });

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 5 }, (_, i) => currentYear - i);
  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  useEffect(() => {
    fetchPerformanceData();
  }, [userId, year, month, view]);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      const url = view === 'month'
        ? `/api/admin/users/${userId}/performance?year=${year}&month=${month}`
        : `/api/admin/users/${userId}/performance?year=${year}`;

      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setSummary(result.data.summary);
        if (view === 'month') {
          setDailyPerformance(result.data.dailyPerformance);
        } else {
          setMonthlyPerformance(result.data.monthlyPerformance);
        }
      }
    } catch (error) {
      console.error('Error fetching performance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return value.toFixed(2);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getColorClass = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const renderMonthView = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const weeks: (DailyPerformance | null)[][] = [];
    let week: (DailyPerformance | null)[] = Array(firstDay).fill(null);

    dailyPerformance.forEach((day) => {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    });

    // Fill remaining days
    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }

    return (
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-700">Win Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm text-gray-700">SOP Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-sm text-gray-700">P/L (USD)</span>
          </div>
        </div>

        {/* Calendar header */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 bg-gray-100 py-2 rounded">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar body */}
        <div className="space-y-2">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-2">
              {week.map((day, dayIdx) => (
                <div
                  key={dayIdx}
                  className={`min-h-[120px] p-3 rounded-lg border-2 ${
                    day
                      ? day.totalTrades > 0
                        ? 'bg-white border-gray-300 hover:border-blue-400 hover:shadow-md transition-all'
                        : 'bg-gray-50 border-gray-200'
                      : 'bg-gray-100 border-gray-200'
                  }`}
                  title={day && day.totalTrades > 0 ? `${day.totalTrades} trades | Win: ${day.totalWins} | Loss: ${day.totalLosses} | SOP: ${day.totalSopFollowed}` : ''}
                >
                  {day && (
                    <div className="space-y-1.5">
                      <div className="text-sm font-bold text-gray-700 mb-2">{day.date}</div>
                      {day.totalTrades > 0 ? (
                        <>
                          <div className="text-xs space-y-1">
                            <div className="flex items-center justify-between bg-green-50 px-2 py-1 rounded border border-green-200">
                              <span className="text-gray-600">Win:</span>
                              <span className="font-semibold text-green-700">{day.winRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between bg-blue-50 px-2 py-1 rounded border border-blue-200">
                              <span className="text-gray-600">SOP:</span>
                              <span className="font-semibold text-blue-700">{day.sopRate.toFixed(1)}%</span>
                            </div>
                            <div className="flex items-center justify-between bg-orange-50 px-2 py-1 rounded border border-orange-200">
                              <span className="text-gray-600">P/L:</span>
                              <span className={`font-bold ${getColorClass(day.profitLoss)}`}>
                                {day.profitLoss >= 0 ? '+' : ''}{formatCurrency(day.profitLoss)}
                              </span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 text-center mt-4">No trades</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    return (
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex items-center gap-6 px-4 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span className="text-sm text-gray-700">Win Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
            <span className="text-sm text-gray-700">SOP Rate</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 border border-orange-300 rounded"></div>
            <span className="text-sm text-gray-700">P/L (USD)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {monthlyPerformance.map((monthData) => (
            <Card
              key={monthData.month}
              className="p-4 bg-white border-2 border-gray-300 cursor-pointer hover:border-blue-400 hover:shadow-lg transition-all"
              onClick={() => {
                setMonth(monthData.month);
                setView('month');
              }}
              title={`${monthData.totalTrades} trades | Win: ${monthData.totalWins} | Loss: ${monthData.totalLosses} | SOP: ${monthData.totalSopFollowed}`}
            >
              <div className="space-y-3">
                <div className="text-base font-bold text-gray-800 border-b pb-2">{monthData.monthName}</div>
                {monthData.totalTrades > 0 ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-green-50 px-2 py-1.5 rounded border border-green-200">
                        <span className="text-xs text-gray-600">Win Rate:</span>
                        <span className="text-sm font-bold text-green-700">{monthData.winRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between bg-blue-50 px-2 py-1.5 rounded border border-blue-200">
                        <span className="text-xs text-gray-600">SOP Rate:</span>
                        <span className="text-sm font-bold text-blue-700">{monthData.sopRate.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center justify-between bg-orange-50 px-2 py-1.5 rounded border border-orange-200">
                        <span className="text-xs text-gray-600">P/L:</span>
                        <span className={`text-base font-bold ${getColorClass(monthData.profitLoss)}`}>
                          {monthData.profitLoss >= 0 ? '+' : ''}{formatCurrency(monthData.profitLoss)}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-sm text-gray-400 text-center py-4">No trades</div>
                  </>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{userName}&apos;s Performance</h2>
          <p className="text-sm text-gray-600 mt-1">
            {view === 'month' 
              ? `${monthNames[month - 1]} ${year}`
              : `${year} Overview`}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* View toggle */}
          <div className="flex bg-gray-200 rounded-lg p-1">
            <Button
              variant={view === 'month' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('month')}
              className={`text-sm ${view === 'month' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 hover:bg-gray-300'}`}
            >
              Month
            </Button>
            <Button
              variant={view === 'year' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setView('year')}
              className={`text-sm ${view === 'year' ? 'bg-blue-600 text-white hover:bg-blue-700' : 'text-gray-700 hover:bg-gray-300'}`}
            >
              Year
            </Button>
          </div>

          {/* Month selector (only in month view) */}
          {view === 'month' && (
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value))}
              className="bg-white text-gray-700 rounded-lg px-3 py-2 text-sm border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:outline-none"
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1}>
                  {name} {year}
                </option>
              ))}
            </select>
          )}

          {/* Year selector */}
          <select
            value={year}
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="bg-white text-gray-700 rounded-lg px-3 py-2 text-sm border-2 border-gray-300 hover:border-blue-400 focus:border-blue-500 focus:outline-none"
          >
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-300">
          <div className="text-sm text-gray-600 mb-1">
            {view === 'month' ? `${monthNames[month - 1]} ${year}` : year} P/L
          </div>
          <div className={`text-2xl font-bold ${getColorClass(summary.profitLoss)}`}>
            ${summary.profitLoss >= 0 ? '+' : ''}{formatCurrency(summary.profitLoss)}
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-300">
          <div className="text-sm text-gray-600 mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-green-700">
            {summary.winRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {summary.totalWins} wins / {summary.totalTrades} trades
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-300">
          <div className="text-sm text-gray-600 mb-1">SOP Rate</div>
          <div className="text-2xl font-bold text-blue-700">
            {summary.sopRate.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-600 mt-1">
            {summary.totalSopFollowed} SOP / {summary.totalTrades} trades
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-300">
          <div className="text-sm text-gray-600 mb-1">Total Trades</div>
          <div className="text-2xl font-bold text-purple-700">
            {summary.totalTrades}
          </div>
          <div className="text-xs text-gray-600 mt-1">
            W:{summary.totalWins} L:{summary.totalLosses}
          </div>
        </Card>
      </div>

      {/* Calendar/Grid view */}
      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading...</div>
      ) : (
        view === 'month' ? renderMonthView() : renderYearView()
      )}
    </div>
  );
}
