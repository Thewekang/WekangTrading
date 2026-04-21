'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Target, 
  CheckCircle,
  Award,
  AlertTriangle,
  TrendingDown,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ChartSkeleton from '@/components/charts/ChartSkeleton';

// Dynamic import for chart component (lazy loading)
const UserComparisonChart = dynamic(() => import('@/components/charts/UserComparisonChart').then(mod => ({ default: mod.UserComparisonChart })), {
  loading: () => <ChartSkeleton />
});

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Collapsible states - priorities and leaderboard open by default, charts collapsed
  const [isPrioritiesOpen, setIsPrioritiesOpen] = useState(true);
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(true);
  const [isWinRateChartOpen, setIsWinRateChartOpen] = useState(false);
  const [isDisciplineChartOpen, setIsDisciplineChartOpen] = useState(false);
  const [isProfitLossChartOpen, setIsProfitLossChartOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/admin/stats');
        const data = await response.json();
        if (data.success) {
          setStats(data.data);
        }
        
        // Fetch per-account leaderboard stats (one row per trading account)
        const usersResponse = await fetch('/api/admin/leaderboard');
        const usersData = await usersResponse.json();
        if (usersData.success) {
          setAllUsers(usersData.data);
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div className="text-center py-12">Loading...</div>
      </div>
    );
  }

  // Coaching insights
  const topPerformer = allUsers[0];
  const avgWinRate = stats.avgWinRateAllUsers;
  const avgSopRate = stats.avgSopRateAllUsers;

  // Identify traders needing attention
  const needsAttention = allUsers.filter(u => u.winRate < 50 || u.sopRate < 65);
  const highPotential = allUsers.filter(u => u.sopRate >= 80 && u.winRate >= 60);
  const inconsistent = allUsers.filter(u => u.winRate < 55 && u.sopRate >= 75);

  const coachingStats = [
    {
      title: 'Total Traders',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      subtitle: `${stats.activeUsersThisMonth} active this month`,
    },
    {
      title: 'Top Performer',
      value: topPerformer ? `${topPerformer.winRate.toFixed(1)}%` : 'N/A',
      icon: Award,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      subtitle: topPerformer
        ? `${topPerformer.userName}${topPerformer.accountName ? ' · ' + topPerformer.accountName : ''}`
        : 'No data',
    },
    {
      title: 'Needs Attention',
      value: needsAttention.length,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      subtitle: `${stats.totalUsers > 0 ? ((needsAttention.length / stats.totalUsers) * 100).toFixed(0) : 0}% of traders`,
    },
    {
      title: 'High Potential',
      value: highPotential.length,
      icon: Zap,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtitle: 'Great discipline',
    },
    {
      title: 'Team Avg Win Rate',
      value: `${stats.avgWinRateAllUsers.toFixed(1)}%`,
      icon: Target,
      color: stats.avgWinRateAllUsers >= 55 ? 'text-green-600' : 'text-orange-600',
      bgColor: stats.avgWinRateAllUsers >= 55 ? 'bg-green-100' : 'bg-orange-100',
      subtitle: `Benchmark: 55%`,
    },
    {
      title: 'Team Avg SOP Rate',
      value: `${stats.avgSopRateAllUsers.toFixed(1)}%`,
      icon: CheckCircle,
      color: stats.avgSopRateAllUsers >= 75 ? 'text-green-600' : 'text-orange-600',
      bgColor: stats.avgSopRateAllUsers >= 75 ? 'bg-green-100' : 'bg-orange-100',
      subtitle: `Benchmark: 75%`,
    },
    {
      title: 'Total Trades',
      value: stats.totalTradesThisMonth.toLocaleString(),
      icon: Activity,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      subtitle: `This month`,
    },
    {
      title: 'Team P&L',
      value: `$${stats.totalProfitLossAllUsers >= 0 ? '+' : ''}${stats.totalProfitLossAllUsers.toFixed(0)}`,
      icon: DollarSign,
      color: stats.totalProfitLossAllUsers >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.totalProfitLossAllUsers >= 0 ? 'bg-green-100' : 'bg-red-100',
      subtitle: 'All time',
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Coaching Metrics Overview */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {coachingStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2 p-3 sm:p-6">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-[10px] sm:text-sm font-medium text-gray-600 truncate">
                    {stat.title}
                  </CardTitle>
                  <div className="text-lg sm:text-2xl font-bold text-gray-900 mt-1">{stat.value}</div>
                  <p className="text-[9px] sm:text-xs text-gray-500 mt-1 truncate">{stat.subtitle}</p>
                </div>
                <div className={`rounded-full p-1.5 sm:p-2 flex-shrink-0 ml-2 ${stat.bgColor}`}>
                  <Icon className={`h-3 w-3 sm:h-4 sm:w-4 ${stat.color}`} />
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Coaching Priorities - Collapsible */}
      {needsAttention.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="p-4 sm:p-6 cursor-pointer" onClick={() => setIsPrioritiesOpen(!isPrioritiesOpen)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1">
                <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <CardTitle className="text-sm sm:text-base text-red-900">Priority: Traders Needing Attention</CardTitle>
              </div>
              {isPrioritiesOpen ? <ChevronUp className="h-5 w-5 text-red-600" /> : <ChevronDown className="h-5 w-5 text-red-600" />}
            </div>
            <p className="text-xs sm:text-sm text-red-700 mt-2">
              Win rates below 50% or SOP compliance below 65% - schedule coaching sessions
            </p>
          </CardHeader>
          {isPrioritiesOpen && (
          <CardContent className="p-4 sm:p-6">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-red-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-800 uppercase">Trader / Account</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-800 uppercase">Win Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-800 uppercase">SOP Rate</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-800 uppercase">P&L</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-red-800 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-red-100">
                  {needsAttention.map((user) => (
                    <tr key={`${user.userId}-${user.accountId}`}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        <div>{user.userName}</div>
                        {user.accountName && (
                          <div className="text-xs text-gray-500 font-normal">{user.accountName}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {user.winRate.toFixed(1)}% {user.winRate < avgWinRate ? '↓' : '↑'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {user.sopRate.toFixed(1)}% {user.sopRate < avgSopRate ? '↓' : '↑'}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={user.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          ${user.netProfitLoss >= 0 ? '+' : ''}{user.netProfitLoss.toFixed(0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs">
                        {user.winRate < 45 && <span className="text-red-600 font-medium">Urgent: Risk Management</span>}
                        {user.winRate >= 45 && user.sopRate < 65 && <span className="text-orange-600 font-medium">Focus: Discipline</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {needsAttention.map((user) => (
                <div key={`${user.userId}-${user.accountId}`} className="bg-white rounded-lg border-2 border-red-300 p-3">
                  <div className="font-semibold text-gray-900">{user.userName}</div>
                  {user.accountName && (
                    <div className="text-xs text-gray-500 mb-2">{user.accountName}</div>
                  )}
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                    <div>
                      <span className="text-gray-600">Win Rate:</span>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {user.winRate.toFixed(1)}% {user.winRate < avgWinRate ? '↓' : '↑'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">SOP Rate:</span>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          {user.sopRate.toFixed(1)}% {user.sopRate < avgSopRate ? '↓' : '↑'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">P&L:</span>
                      <div className={`mt-1 font-semibold ${user.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${user.netProfitLoss >= 0 ? '+' : ''}{user.netProfitLoss.toFixed(0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Action:</span>
                      <div className="mt-1 font-medium">
                        {user.winRate < 45 && <span className="text-red-600 text-[10px]">Urgent: Risk Mgmt</span>}
                        {user.winRate >= 45 && user.sopRate < 65 && <span className="text-orange-600 text-[10px]">Focus: Discipline</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          )}
        </Card>
      )}

      {/* Performance Leaderboard - Collapsible */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setIsLeaderboardOpen(!isLeaderboardOpen)}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Performance Leaderboard
                {isLeaderboardOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Ranked by win rate (primary) and SOP compliance (secondary) — per trading account
              </p>
            </div>
          </div>
        </CardHeader>
        {isLeaderboardOpen && (
        <CardContent>
          {allUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No trading data available yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trader / Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trades</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Win Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SOP Rate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best SOP</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">P&L</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg/Trade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {allUsers.map((user) => {
                    const isAboveAvgWin = user.winRate > avgWinRate;
                    const isAboveAvgSop = user.sopRate > avgSopRate;
                    
                    return (
                      <tr key={`${user.userId}-${user.accountId}`} className={`hover:bg-gray-50 ${
                        user.rank && user.rank <= 2 ? 'bg-green-50' : 
                        needsAttention.some(u => u.userId === user.userId) ? 'bg-red-50' : ''
                      }`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {user.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                            {user.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                            {user.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                            {(user.rank || 0) > 3 && (
                              <span className="text-sm font-medium text-gray-900">#{user.rank}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                          {user.accountName && (
                            <div className="text-xs text-gray-500">{user.accountName}</div>
                          )}
                          <div className="text-xs text-gray-400">Best: {user.bestSession}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div>{user.totalTrades}</div>
                          <div className="text-xs text-gray-500">{user.totalWins}W / {user.totalLosses}L</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.winRate >= 65 ? 'bg-green-100 text-green-800' :
                              user.winRate >= 55 ? 'bg-blue-100 text-blue-800' :
                              user.winRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {user.winRate.toFixed(1)}%
                            </span>
                            {isAboveAvgWin ? 
                              <TrendingUp className="h-3 w-3 text-green-600" /> : 
                              <TrendingDown className="h-3 w-3 text-red-600" />
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              user.sopRate >= 85 ? 'bg-green-100 text-green-800' :
                              user.sopRate >= 75 ? 'bg-blue-100 text-blue-800' :
                              user.sopRate >= 65 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {user.sopRate.toFixed(1)}%
                            </span>
                            {isAboveAvgSop ? 
                              <CheckCircle className="h-3 w-3 text-green-600" /> : 
                              <AlertTriangle className="h-3 w-3 text-orange-600" />
                            }
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.bestSop ? (
                            <div>
                              <div className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-800 text-xs font-medium">
                                {user.bestSop}
                              </div>
                              <div className="text-xs text-gray-600 mt-1">
                                {user.bestSopWinRate.toFixed(1)}% win rate
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No data</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`text-sm font-medium ${
                            user.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            ${user.netProfitLoss >= 0 ? '+' : ''}{user.netProfitLoss.toFixed(0)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          ${user.avgProfitPerTrade.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {user.rank && user.rank <= 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-100 text-green-700 font-medium">
                              ⭐ Role Model
                            </span>
                          )}
                          {highPotential.some(u => u.userId === user.userId && u.accountId === user.accountId) && user.rank && user.rank > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-100 text-purple-700 font-medium">
                              💎 High Potential
                            </span>
                          )}
                          {needsAttention.some(u => u.userId === user.userId && u.accountId === user.accountId) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-red-700 font-medium">
                              ⚠️ Needs Help
                            </span>
                          )}
                          {inconsistent.some(u => u.userId === user.userId && u.accountId === user.accountId) && (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-700 font-medium">
                              📊 Inconsistent
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
        )}
      </Card>

      {/* Comparative Analysis Charts - Collapsed by Default */}
      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setIsWinRateChartOpen(!isWinRateChartOpen)}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Win Rate Comparison
                {isWinRateChartOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Who's winning more trades?</p>
            </div>
          </div>
        </CardHeader>
        {isWinRateChartOpen && (
          <CardContent>
            <UserComparisonChart
              metric="winRate"
              title="Win Rate Comparison"
              description="Who's winning more trades?"
            />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setIsDisciplineChartOpen(!isDisciplineChartOpen)}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Discipline Comparison
                {isDisciplineChartOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Who's following the plan?</p>
            </div>
          </div>
        </CardHeader>
        {isDisciplineChartOpen && (
          <CardContent>
            <UserComparisonChart
              metric="sopRate"
              title="Discipline Comparison"
              description="Who's following the plan?"
            />
          </CardContent>
        )}
      </Card>

      <Card>
        <CardHeader className="cursor-pointer" onClick={() => setIsProfitLossChartOpen(!isProfitLossChartOpen)}>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                Profit/Loss Comparison
                {isProfitLossChartOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Who's making money?</p>
            </div>
          </div>
        </CardHeader>
        {isProfitLossChartOpen && (
          <CardContent>
            <UserComparisonChart
              metric="profitLoss"
              title="Profit/Loss Comparison"
              description="Who's making money?"
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
