import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { ToastContainer } from '@/components/ui/Toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TimezoneProvider } from '@/contexts/TimezoneContext';
import { QuoteSystemProvider } from '@/contexts/QuoteSystemContext';
import { ActiveAccountProvider } from '@/contexts/ActiveAccountContext';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getUserAccounts } from '@/lib/services/tradingAccountService';
import { DesktopNav, MobileNav } from '@/components/navigation/NavMenu';
import { NotificationBell } from '@/components/navigation/NotificationBell';
import { BottomNav } from '@/components/navigation/BottomNav';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { AccountSwitcher } from '@/components/navigation/AccountSwitcher';
import { Wallet, TrendingUp, Shield, BarChart2, LayoutDashboard } from 'lucide-react';

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  PROP_FIRM: 'Prop Firm',
  FUTURES: 'Futures',
  CFD: 'CFD',
  FOREX: 'Forex',
  SHARE: 'Share',
  DEMO: 'Demo',
};

export default async function UserLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Get user's preferred timezone, accounts, and active account cookie in parallel
  const [user, initialAccounts, cookieStore] = await Promise.all([
    db.select({ preferredTimezone: users.preferredTimezone })
      .from(users)
      .where(eq(users.id, session.user.id))
      .get(),
    getUserAccounts(session.user.id),
    cookies(),
  ]);

  const userTimezone = user?.preferredTimezone || 'Asia/Kuala_Lumpur';

  // Resolve active account from cookie or default
  const cookieAccountId = cookieStore.get('active_account_id')?.value;
  const activeAccount =
    (cookieAccountId && initialAccounts.find((a) => a.id === cookieAccountId)) ||
    initialAccounts.find((a) => a.isDefault) ||
    initialAccounts[0] ||
    null;

  return (
    <TimezoneProvider userTimezone={userTimezone}>
      <QuoteSystemProvider>
        <ActiveAccountProvider initialAccounts={initialAccounts}>
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
                  <AccountSwitcher />
                  <MobileNav />
                  {/* Notification Bell */}
                  <NotificationBell />
                  <span className="text-sm text-gray-600 hidden sm:inline">
                    {session.user.name}
                  </span>
                  <SignOutButton className="text-sm text-red-600 hover:text-red-800 hidden sm:inline">
                    Sign out
                  </SignOutButton>
                </div>
              </div>
            </div>
          </nav>

          {/* Active Account Context Strip */}
          {activeAccount && (
            <div className="bg-indigo-600 text-white">
              <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-9">
                  {/* Account name */}
                  <Link
                    href={`/accounts/${activeAccount.id}`}
                    className="flex items-center gap-1.5 text-xs font-semibold hover:text-indigo-200 transition-colors"
                  >
                    <Wallet className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate max-w-[140px] sm:max-w-none">{activeAccount.name}</span>
                    <span className="text-indigo-300 font-normal hidden sm:inline">
                      ({ACCOUNT_TYPE_LABELS[activeAccount.accountType] ?? activeAccount.accountType})
                    </span>
                  </Link>
                  {/* Quick nav links */}
                  <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto">
                    <Link href={`/accounts/${activeAccount.id}/dashboard`} className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors">
                      <LayoutDashboard className="h-3 w-3" />
                      Dashboard
                    </Link>
                    <Link href="/trades" className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors">
                      <TrendingUp className="h-3 w-3" />
                      Trades
                    </Link>
                    <Link href="/discipline-tracker" className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors">
                      <Shield className="h-3 w-3" />
                      Discipline
                    </Link>
                    <Link href="/analytics/trends" className="flex items-center gap-1 text-xs text-indigo-200 hover:text-white transition-colors">
                      <BarChart2 className="h-3 w-3" />
                      Performance
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <main className="pb-16 lg:pb-0">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <BottomNav />
          <ToastContainer />
        </div>
        </ActiveAccountProvider>
      </QuoteSystemProvider>
    </TimezoneProvider>
  );
}
