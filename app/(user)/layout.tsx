import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import Link from 'next/link';
import { ToastContainer } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TimezoneProvider } from '@/contexts/TimezoneContext';
import { db } from '@/lib/db';
import { users, motivationalMessages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Bell } from 'lucide-react';
import { DesktopNav, MobileNav } from '@/components/navigation/NavMenu';

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

  // Get unread notification count
  const unreadMessages = await db
    .select({ count: motivationalMessages.id })
    .from(motivationalMessages)
    .where(and(
      eq(motivationalMessages.userId, session.user.id),
      eq(motivationalMessages.isRead, false)
    ))
    .all();
  
  const unreadCount = unreadMessages.length;

  return (
    <TimezoneProvider userTimezone={userTimezone}>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-8">
                <Link href="/dashboard" className="flex items-center space-x-2">
                  <span className="text-2xl">🏍️💰</span>
                  <span className="font-bold text-xl hidden sm:inline">WekangTradingJournal</span>
                  <span className="font-bold text-lg sm:hidden">Wekang</span>
                </Link>
                <DesktopNav />
              </div>
              <div className="flex items-center space-x-3">
                <MobileNav />
                {/* Notification Bell */}
                <Link href="/notifications" className="relative">
                  <Bell className="h-5 w-5 text-gray-600 hover:text-gray-900" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>
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
    </TimezoneProvider>
  );
}
