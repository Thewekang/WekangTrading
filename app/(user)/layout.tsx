import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import Link from 'next/link';
import { ToastContainer } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TimezoneProvider } from '@/contexts/TimezoneContext';
import { QuoteSystemProvider } from '@/contexts/QuoteSystemContext';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { DesktopNav, MobileNav } from '@/components/navigation/NavMenu';
import { NotificationBell } from '@/components/navigation/NotificationBell';

export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Get user's preferred timezone
  const user = await db.select({ preferredTimezone: users.preferredTimezone })
    .from(users)
    .where(eq(users.id, session.user.id))
    .get();
  
  const userTimezone = user?.preferredTimezone || 'Asia/Kuala_Lumpur';

  return (
    <TimezoneProvider userTimezone={userTimezone}>
      <QuoteSystemProvider>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white border-b">
            <div className="container mx-auto px-4">
              <div className="flex items-center justify-between h-16">
                <div className="flex items-center space-x-8">
                  <Link href="/dashboard" className="flex items-center space-x-2">
                    <img src="/logo.png" alt="Wekang Trading" className="w-8 h-8 object-contain" />
                    <span className="font-bold text-xl hidden sm:inline">WekangTradingJournal</span>
                    <span className="font-bold text-lg sm:hidden">Wekang</span>
                  </Link>
                  <DesktopNav />
                </div>
                <div className="flex items-center space-x-3">
                  <MobileNav />
                  {/* Notification Bell */}
                  <NotificationBell />
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {session.user.name}
                  </span>
                  <Link href="/api/auth/signout" className="text-sm text-red-600 hover:text-red-800 hidden sm:inline">
                    Sign out
                  </Link>
                </div>
              </div>
            </div>
          </nav>
          <main>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <ToastContainer />
        </div>
      </QuoteSystemProvider>
    </TimezoneProvider>
  );
}
