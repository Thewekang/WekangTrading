'use client';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import Link from 'next/link';
import SettingsDropdown from '@/components/admin/SettingsDropdown';
import { LayoutDashboard, Users, TrendingUp, Calendar, Menu, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Redirect if not authenticated or not admin
    if (status === 'unauthenticated') {
      window.location.href = '/login';
    } else if (status === 'authenticated' && session?.user?.role !== 'ADMIN') {
      window.location.href = '/dashboard';
    }
  }, [status, session]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session || session.user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/admin/overview" className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <img src="/logo.png" alt="Wekang Trading" className="w-7 h-7 object-contain" />
                  <span className="hidden sm:inline">Admin Panel</span>
                  <span className="sm:hidden">Admin</span>
                </Link>
              </div>
              <div className="hidden lg:ml-8 lg:flex lg:space-x-8 items-center">
                <Link
                  href="/admin/overview"
                  className="inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-900 hover:border-gray-300"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Overview
                </Link>
                <Link
                  href="/admin/users"
                  className="inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  <Users className="h-4 w-4" />
                  Users
                </Link>
                <Link
                  href="/admin/trades"
                  className="inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  <TrendingUp className="h-4 w-4" />
                  Trades
                </Link>
                <Link
                  href="/admin/economic-calendar/view"
                  className="inline-flex items-center gap-1.5 border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700"
                >
                  <Calendar className="h-4 w-4" />
                  Calendar
                </Link>
                <SettingsDropdown />
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="hidden sm:block text-sm text-gray-600">
                {session.user.email}
              </div>
              <Link
                href="/api/auth/signout"
                className="hidden sm:inline text-sm font-medium text-red-600 hover:text-red-800"
              >
                Sign out
              </Link>
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 py-4 space-y-2">
              <Link
                href="/admin/overview"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard className="h-5 w-5" />
                Overview
              </Link>
              <Link
                href="/admin/users"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Users className="h-5 w-5" />
                Users
              </Link>
              <Link
                href="/admin/trades"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <TrendingUp className="h-5 w-5" />
                Trades
              </Link>
              <Link
                href="/admin/economic-calendar/view"
                className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Calendar className="h-5 w-5" />
                Calendar
              </Link>
              <div className="border-t border-gray-200 pt-2">
                <div className="px-3 py-2 text-sm text-gray-600">
                  {session.user.email}
                </div>
                <Link
                  href="/api/auth/signout"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Sign out
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
