'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronRight, Calendar, Users, TrendingUp, AlertTriangle, ExternalLink } from 'lucide-react';
import { OUTCOME_COLORS } from '@/lib/types/disciplineTracker';
import type { DisciplineTrackerRow, DisciplineTrackerSettings } from '@/lib/db/schema';
import type { DayEvaluation } from '@/lib/types/disciplineTracker';
import { useTimezone } from '@/contexts/TimezoneContext';

interface EvaluatedRow extends DisciplineTrackerRow {
  evaluation: DayEvaluation;
}

interface UserData {
  user: {
    id: string;
    name: string;
    email: string;
  };
  settings: DisciplineTrackerSettings;
  rows: EvaluatedRow[];
}

interface TeamOverviewData {
  timeline: string[];
  users: UserData[];
  startDate: string;
  endDate: string;
  days: number;
}

export default function AdminDisciplineTrackerPage() {
  const { formatDate: formatDateTz, timezone } = useTimezone();
  const [data, setData] = useState<TeamOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [days, setDays] = useState(14);

  useEffect(() => {
    fetchData();
  }, [days]);

  async function fetchData() {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/discipline-tracker/team-overview?days=${days}`);
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching team overview:', error);
    } finally {
      setLoading(false);
    }
  }

  function toggleUser(userId: string) {
    setExpandedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  }

  function getRowForDate(userRows: EvaluatedRow[], date: string): EvaluatedRow | null {
    // Get date in YYYY-MM-DD format in user's timezone
    const getDateInTimezone = (dateInput: Date | string) => {
      const d = new Date(dateInput);
      const formatter = new Intl.DateTimeFormat('en-CA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        timeZone: timezone,
      });
      return formatter.format(d); // Returns YYYY-MM-DD
    };
    
    const timelineDate = getDateInTimezone(date);
    
    return userRows.find((row) => {
      const rowDate = getDateInTimezone(row.tradeDate);
      return rowDate === timelineDate;
    }) || null;
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: timezone,
    }).format(date);
  }

  function getDayOfWeek(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'short',
      timeZone: timezone,
    }).format(date);
  }

  function getCellColor(row: EvaluatedRow | null): string {
    if (!row) return 'bg-gray-50';
    
    const { evaluation } = row;
    const { dayPnl, wins, losses } = evaluation;

    // Determine outcome
    if (wins > 0) return 'bg-green-100 hover:bg-green-200';
    if (losses > 0 && wins === 0) return 'bg-red-100 hover:bg-red-200';
    if (dayPnl === 0) return 'bg-yellow-50 hover:bg-yellow-100';
    return 'bg-gray-50 hover:bg-gray-100';
  }

  function getCellContent(row: EvaluatedRow | null): string {
    if (!row) return '—';
    
    const { dayPnl } = row.evaluation;
    if (dayPnl > 0) return `+$${dayPnl.toFixed(0)}`;
    if (dayPnl < 0) return `-$${Math.abs(dayPnl).toFixed(0)}`;
    return 'BE';
  }

  function getUserSummary(userData: UserData) {
    const { rows } = userData;
    let totalDays = 0;
    let winDays = 0;
    let lossDays = 0;
    let beDays = 0;
    let totalPnl = 0;
    let violations = 0;

    rows.forEach((row) => {
      totalDays++;
      totalPnl += row.evaluation.dayPnl;

      if (row.evaluation.wins > 0) {
        winDays++;
      } else if (row.evaluation.losses > 0 && row.evaluation.wins === 0) {
        lossDays++;
      } else if (row.evaluation.dayPnl === 0) {
        beDays++;
      }

      // Check for violations (trades that shouldn't be there)
      if (row.trade2Outcome && row.trade2Outcome !== 'EMPTY' && !row.evaluation.allowedTrade2) {
        violations++;
      }
      if (row.trade3Outcome && row.trade3Outcome !== 'EMPTY' && !row.evaluation.allowedTrade3) {
        violations++;
      }
    });

    return {
      totalDays,
      winDays,
      lossDays,
      beDays,
      totalPnl,
      violations,
      winRate: totalDays > 0 ? (winDays / totalDays) * 100 : 0,
    };
  }

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Team Discipline Tracker</h1>
        </div>
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  const { timeline, users } = data;

  // Calculate team stats
  const teamStats = users.reduce(
    (acc, userData) => {
      const summary = getUserSummary(userData);
      acc.totalDays += summary.totalDays;
      acc.winDays += summary.winDays;
      acc.lossDays += summary.lossDays;
      acc.totalPnl += summary.totalPnl;
      acc.violations += summary.violations;
      return acc;
    },
    { totalDays: 0, winDays: 0, lossDays: 0, totalPnl: 0, violations: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header with Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Team Discipline Tracker</h1>
        
        <div className="flex items-center gap-2">
          <label htmlFor="days-select" className="text-sm font-medium text-gray-700">
            Period:
          </label>
          <select
            id="days-select"
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="7">7 Days</option>
            <option value="14">14 Days</option>
            <option value="30">30 Days</option>
          </select>
        </div>
      </div>

      {/* Team Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Traders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-gray-500 mt-1">{teamStats.totalDays} total days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Team Win Days
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {teamStats.totalDays > 0 ? ((teamStats.winDays / teamStats.totalDays) * 100).toFixed(1) : 0}%
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {teamStats.winDays} of {teamStats.totalDays} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Team P&L
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${teamStats.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {teamStats.totalPnl >= 0 ? '+' : ''}${teamStats.totalPnl.toFixed(0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">Last {days} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Rule Violations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${teamStats.violations === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {teamStats.violations}
            </div>
            <p className="text-xs text-gray-500 mt-1">Unauthorized trades</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Grid - Desktop View */}
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle className="text-lg">Timeline Overview</CardTitle>
          <p className="text-sm text-gray-500">
            Click trader name to view full details. Click chevron to expand daily stats. Hover cells for P&L.
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              {/* Header Row with Dates */}
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10 border border-gray-200 p-2 text-left min-w-[180px]">
                    Trader
                  </th>
                  {timeline.map((date) => (
                    <th
                      key={date}
                      className="border border-gray-200 p-2 text-center text-xs min-w-[80px]"
                    >
                      <div className="font-medium text-gray-900">{formatDate(date)}</div>
                      <div className="text-gray-500 font-normal">{getDayOfWeek(date)}</div>
                    </th>
                  ))}
                  <th className="border border-gray-200 p-2 text-center min-w-[100px]">
                    Summary
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((userData) => {
                  const summary = getUserSummary(userData);
                  const isExpanded = expandedUsers.has(userData.user.id);

                  return (
                    <React.Fragment key={userData.user.id}>
                      {/* Main trader row */}
                      <tr className="hover:bg-gray-50">
                        <td className="sticky left-0 bg-white z-10 border border-gray-200 p-2">
                          <div className="flex items-center gap-2 w-full">
                            <button
                              onClick={() => toggleUser(userData.user.id)}
                              className="flex items-center gap-2 hover:text-blue-600"
                            >
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 flex-shrink-0" />
                              ) : (
                                <ChevronRight className="h-4 w-4 flex-shrink-0" />
                              )}
                            </button>
                            <Link
                              href={`/admin/users/${userData.user.id}/discipline-tracker`}
                              className="flex-1 hover:text-blue-600 group"
                            >
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-medium text-sm">{userData.user.name}</div>
                                  <div className="text-xs text-gray-500">{userData.user.email}</div>
                                </div>
                                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </Link>
                          </div>
                        </td>
                        {timeline.map((date) => {
                          const row = getRowForDate(userData.rows, date);
                          return (
                            <td
                              key={date}
                              className={`border border-gray-200 p-2 text-center text-sm font-medium ${getCellColor(row)} transition-colors`}
                              title={row ? `P&L: ${getCellContent(row)}` : 'No data'}
                            >
                              {getCellContent(row)}
                            </td>
                          );
                        })}
                        <td className="border border-gray-200 p-2 text-center text-sm">
                          <div className="font-medium text-gray-900">
                            {summary.winRate.toFixed(0)}%
                          </div>
                          <div className={`text-xs ${summary.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {summary.totalPnl >= 0 ? '+' : ''}${summary.totalPnl.toFixed(0)}
                          </div>
                        </td>
                      </tr>

                      {/* Expanded details row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={timeline.length + 2} className="border border-gray-200 bg-gray-50 p-4">
                            <div className="space-y-2 text-sm">
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                  <span className="text-gray-600">Win Days:</span>
                                  <span className="ml-2 font-medium text-green-600">
                                    {summary.winDays} ({summary.winRate.toFixed(0)}%)
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Loss Days:</span>
                                  <span className="ml-2 font-medium text-red-600">{summary.lossDays}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">BE Days:</span>
                                  <span className="ml-2 font-medium text-yellow-600">{summary.beDays}</span>
                                </div>
                                <div>
                                  <span className="text-gray-600">Violations:</span>
                                  <span className={`ml-2 font-medium ${summary.violations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {summary.violations}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Mobile View - Card Based */}
      <div className="lg:hidden space-y-4">
        {users.map((userData) => {
          const summary = getUserSummary(userData);
          const isExpanded = expandedUsers.has(userData.user.id);

          return (
            <Card key={userData.user.id}>
              <CardHeader>
                <div className="space-y-3">
                  <button
                    onClick={() => toggleUser(userData.user.id)}
                    className="flex items-center justify-between w-full text-left"
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5" />
                      ) : (
                        <ChevronRight className="h-5 w-5" />
                      )}
                      <div>
                        <div className="font-medium">{userData.user.name}</div>
                        <div className="text-sm text-gray-500">{userData.user.email}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{summary.winRate.toFixed(0)}%</div>
                      <div className={`text-sm ${summary.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {summary.totalPnl >= 0 ? '+' : ''}${summary.totalPnl.toFixed(0)}
                      </div>
                    </div>
                  </button>
                  <Link
                    href={`/admin/users/${userData.user.id}/discipline-tracker`}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Full Details
                  </Link>
                </div>
              </CardHeader>
              
              {isExpanded && (
                <CardContent className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-green-50 p-3 rounded">
                      <div className="text-gray-600">Win Days</div>
                      <div className="font-bold text-green-600">{summary.winDays}</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded">
                      <div className="text-gray-600">Loss Days</div>
                      <div className="font-bold text-red-600">{summary.lossDays}</div>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded">
                      <div className="text-gray-600">BE Days</div>
                      <div className="font-bold text-yellow-600">{summary.beDays}</div>
                    </div>
                    <div className={`${summary.violations > 0 ? 'bg-red-50' : 'bg-green-50'} p-3 rounded`}>
                      <div className="text-gray-600">Violations</div>
                      <div className={`font-bold ${summary.violations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {summary.violations}
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Daily P&L</div>
                    <div className="grid grid-cols-7 gap-1">
                      {timeline.map((date) => {
                        const row = getRowForDate(userData.rows, date);
                        return (
                          <div key={date} className="text-center">
                            <div className="text-xs text-gray-500 mb-1">
                              {formatDate(date).split(' ')[1]}
                            </div>
                            <div
                              className={`p-2 rounded text-xs font-medium ${getCellColor(row)}`}
                            >
                              {getCellContent(row)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-100 border border-green-200 rounded"></div>
              <span>Win Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-red-100 border border-red-200 rounded"></div>
              <span>Loss Day</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-50 border border-yellow-200 rounded"></div>
              <span>Break Even</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gray-50 border border-gray-200 rounded"></div>
              <span>No Data</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
