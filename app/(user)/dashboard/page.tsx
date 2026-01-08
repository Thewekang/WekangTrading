import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, {session.user.name}! 🏍️💰
          </h1>
          <p className="text-muted-foreground">
            Track your trading performance and analyze your results
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="p-6 bg-white rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Total Trades</h3>
            <p className="text-3xl font-bold">0</p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Win Rate</h3>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">SOP Compliance</h3>
            <p className="text-3xl font-bold">0%</p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </div>

          <div className="p-6 bg-white rounded-lg shadow border">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Net P/L</h3>
            <p className="text-3xl font-bold">$0.00</p>
            <p className="text-sm text-muted-foreground mt-2">This month</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-blue-900 mb-4">🎯 Phase 1 Complete!</h2>
          <p className="text-blue-800 mb-4">
            Authentication system is ready. Next features coming in Phase 2:
          </p>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Real-time trade entry (mobile-optimized)</li>
            <li>• Bulk trade entry (end-of-day workflow)</li>
            <li>• Market session auto-detection (ASIA/EUROPE/US)</li>
            <li>• Daily summary dashboard with analytics</li>
            <li>• Hourly performance heatmap</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
