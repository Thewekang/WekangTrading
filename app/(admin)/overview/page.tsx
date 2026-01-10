import { getAdminDashboardStats } from '@/lib/services/adminStatsService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  Target, 
  CheckCircle,
  Calendar
} from 'lucide-react';
import { UserComparisonChart } from '@/components/charts/UserComparisonChart';

export default async function AdminDashboardPage() {
  const stats = await getAdminDashboardStats();

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active This Month',
      value: stats.activeUsersThisMonth,
      icon: Activity,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Total Trades',
      value: stats.totalTradesAllTime.toLocaleString(),
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Trades This Month',
      value: stats.totalTradesThisMonth.toLocaleString(),
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      title: 'Avg Win Rate',
      value: `${stats.avgWinRateAllUsers.toFixed(1)}%`,
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Avg SOP Rate',
      value: `${stats.avgSopRateAllUsers.toFixed(1)}%`,
      icon: CheckCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total P&L',
      value: `$${stats.totalProfitLossAllUsers >= 0 ? '+' : ''}${stats.totalProfitLossAllUsers.toFixed(2)}`,
      icon: DollarSign,
      color: stats.totalProfitLossAllUsers >= 0 ? 'text-green-600' : 'text-red-600',
      bgColor: stats.totalProfitLossAllUsers >= 0 ? 'bg-green-100' : 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-gray-600">
          System overview and top performer rankings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-full p-2 ${stat.bgColor}`}>
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>Top 5 Performers</CardTitle>
          <p className="text-sm text-gray-600">
            Ranked by win rate, then SOP rate
          </p>
        </CardHeader>
        <CardContent>
          {stats.topPerformers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No trading data available yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trades
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Win Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SOP Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      P&L
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Best Session
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topPerformers.map((user) => (
                    <tr key={user.userId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {user.rank === 1 && <span className="text-2xl mr-2">🥇</span>}
                          {user.rank === 2 && <span className="text-2xl mr-2">🥈</span>}
                          {user.rank === 3 && <span className="text-2xl mr-2">🥉</span>}
                          {(user.rank || 0) > 3 && (
                            <span className="text-sm font-medium text-gray-900">
                              #{user.rank}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {user.userName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.userEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.totalTrades}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.winRate >= 60 ? 'bg-green-100 text-green-800' :
                          user.winRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.winRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.sopRate >= 80 ? 'bg-green-100 text-green-800' :
                          user.sopRate >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {user.sopRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm font-medium ${
                          user.netProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${user.netProfitLoss >= 0 ? '+' : ''}{user.netProfitLoss.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.bestSession || 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity Chart */}
      {stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity (Last 30 Days)</CardTitle>
            <p className="text-sm text-gray-600">
              Daily trades and active users
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Trades
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Active Users
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.recentActivity.slice(-10).reverse().map((activity) => (
                    <tr key={activity.date}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(activity.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.totalTrades}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {activity.activeUsers}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UserComparisonChart
          metric="winRate"
          title="Win Rate Comparison"
          description="Top 10 users by win rate"
        />
        <UserComparisonChart
          metric="sopRate"
          title="SOP Rate Comparison"
          description="Top 10 users by SOP compliance"
        />
      </div>
      <div className="grid grid-cols-1">
        <UserComparisonChart
          metric="profitLoss"
          title="Profit/Loss Comparison"
          description="Top 10 users by total P&L"
        />
      </div>
    </div>
  );
}
