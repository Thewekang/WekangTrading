export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">
          🏍️💰 WekangTradingJournal
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Trading Performance Tracking System
        </p>
        <div className="space-y-4">
          <div className="p-6 bg-white rounded-lg shadow-md border">
            <h2 className="text-2xl font-semibold mb-2">Phase 0: Setup Complete ✅</h2>
            <p className="text-gray-600">
              Next.js 15 + TypeScript + Tailwind CSS configured
            </p>
          </div>
          <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
            <ul className="text-left text-sm text-blue-800 space-y-1">
              <li>• Install Prisma and dependencies</li>
              <li>• Set up Turso database connection</li>
              <li>• Configure NextAuth.js v5</li>
              <li>• Create database schema</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
