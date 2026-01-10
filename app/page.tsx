import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        {/* Navigation */}
        <nav className="flex justify-between items-center mb-16">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🏍️💰</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">WekangTrading</h1>
              <p className="text-xs text-slate-600">Performance Tracking System</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="outline" size="lg" className="font-semibold">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" className="font-semibold bg-blue-600 hover:bg-blue-700">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-20">
          <div className="mb-6">
            <span className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
              🚀 Professional Trading Analytics
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
            Master Your Trading<br />
            <span className="text-blue-600">Performance</span>
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Track every trade, analyze timing patterns, and optimize your trading strategy with real-time insights and comprehensive analytics.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="text-lg px-8 py-6 bg-blue-600 hover:bg-blue-700">
                Start Tracking Now →
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">⏱️</div>
            <h3 className="text-xl font-bold mb-2">Real-Time Entry</h3>
            <p className="text-slate-600">
              Log trades instantly during your session with mobile-optimized quick entry
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-xl font-bold mb-2">Session Analysis</h3>
            <p className="text-slate-600">
              Identify your best trading hours across ASIA, EUROPE, and US market sessions
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🎯</div>
            <h3 className="text-xl font-bold mb-2">Performance Targets</h3>
            <p className="text-slate-600">
              Set goals, track progress, and achieve consistent profitability
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">📈</div>
            <h3 className="text-xl font-bold mb-2">Trend Analytics</h3>
            <p className="text-slate-600">
              Visualize win rates, profit trends, and SOP compliance over time
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">🔍</div>
            <h3 className="text-xl font-bold mb-2">Detailed Insights</h3>
            <p className="text-slate-600">
              Deep dive into every trade with comprehensive filtering and export options
            </p>
          </Card>
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="text-3xl mb-4">👥</div>
            <h3 className="text-xl font-bold mb-2">Team Management</h3>
            <p className="text-slate-600">
              Admin dashboard for monitoring team performance and comparisons
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 max-w-4xl mx-auto text-white">
          <h3 className="text-3xl font-bold mb-4">
            Ready to Elevate Your Trading?
          </h3>
          <p className="text-xl mb-8 text-blue-100">
            Join traders who track, analyze, and improve their performance daily
          </p>
          <Link href="/register">
            <Button size="lg" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-slate-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-2xl">🏍️💰</span>
            <span className="font-bold">WekangTrading</span>
          </div>
          <p className="text-sm">
            © {new Date().getFullYear()} WekangTrading Journal. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
