import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 overflow-x-hidden">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8 sm:py-16">
        {/* Navigation */}
        <nav className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-12 sm:mb-16">
          <div className="flex items-center gap-2 sm:gap-3">
            <img src="/logo.png" alt="Wekang Trading" className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-slate-900">WekangTrading</h1>
              <p className="text-[10px] sm:text-xs text-slate-600">Performance Tracking System</p>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm" className="font-semibold sm:text-base text-sm px-4 sm:px-6">
                Login
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="font-semibold bg-blue-600 hover:bg-blue-700 sm:text-base text-sm px-4 sm:px-6">
                Get Started
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero Content */}
        <div className="text-center max-w-4xl mx-auto mb-12 sm:mb-20">
          {/* Large Brand Logo */}
          <div className="mb-6 sm:mb-8 flex justify-center">
            <img 
              src="/logo.png" 
              alt="Wekang Trading" 
              className="w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 object-contain drop-shadow-lg" 
            />
          </div>
          <div className="mb-4 sm:mb-6">
            <span className="inline-block px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-100 text-blue-700 rounded-full text-xs sm:text-sm font-semibold mb-4">
              🚀 Professional Trading Analytics
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 leading-tight px-4">
            Master Your Trading<br />
            <span className="text-blue-600">Performance</span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-6 sm:mb-8 max-w-2xl mx-auto px-4">
            Track every trade, analyze timing patterns, and optimize your trading strategy with real-time insights and comprehensive analytics.
          </p>
          <div className="flex gap-4 justify-center px-4">
            <Link href="/register">
              <Button size="lg" className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 bg-blue-600 hover:bg-blue-700">
                Start Tracking Now →
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 max-w-6xl mx-auto mb-12 sm:mb-20">
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">⏱️</div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Real-Time Entry</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Log trades instantly during your session with mobile-optimized quick entry
            </p>
          </Card>
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">📊</div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Session Analysis</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Identify your best trading hours across ASIA, EUROPE, and US market sessions
            </p>
          </Card>
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">🎯</div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Performance Targets</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Set goals, track progress, and achieve consistent profitability
            </p>
          </Card>
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">📈</div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Trend Analytics</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Visualize win rates, profit trends, and SOP compliance over time
            </p>
          </Card>
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">🔍</div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Detailed Insights</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Deep dive into every trade with comprehensive filtering and export options
            </p>
          </Card>
          <Card className="p-4 sm:p-6 hover:shadow-lg transition-shadow">
            <div className="text-2xl sm:text-3xl mb-3 sm:mb-4">👥</div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Team Management</h3>
            <p className="text-sm sm:text-base text-slate-600">
              Admin dashboard for monitoring team performance and comparisons
            </p>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl p-8 sm:p-12 max-w-4xl mx-auto text-white">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
            Ready to Elevate Your Trading?
          </h3>
          <p className="text-base sm:text-xl mb-6 sm:mb-8 text-blue-100">
            Join traders who track, analyze, and improve their performance daily
          </p>
          <Link href="/register">
            <Button size="lg" className="text-base sm:text-lg px-6 py-5 sm:px-8 sm:py-6 bg-white text-blue-600 hover:bg-blue-50">
              Create Free Account
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-white mt-12 sm:mt-20">
        <div className="container mx-auto px-4 py-6 sm:py-8 text-center text-slate-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/logo.png" alt="Wekang Trading" className="w-6 h-6 sm:w-8 sm:h-8 object-contain" />
            <span className="font-bold text-sm sm:text-base">WekangTrading</span>
          </div>
          <p className="text-xs sm:text-sm">
            © {new Date().getFullYear()} WekangTrading Journal. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
