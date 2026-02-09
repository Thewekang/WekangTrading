'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, TrendingUp, Calendar, Menu, X, Settings, ChevronDown, FileText, Ticket, Quote } from 'lucide-react';
import SettingsDropdown from '@/components/admin/SettingsDropdown';

interface AdminNavProps {
  userEmail: string;
}

export function AdminNav({ userEmail }: AdminNavProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSettingsExpanded, setIsSettingsExpanded] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { href: '/admin/overview', icon: LayoutDashboard, label: 'Overview' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/trades', icon: TrendingUp, label: 'Trades' },
    { href: '/admin/economic-calendar/view', icon: Calendar, label: 'Calendar' },
  ];

  return (
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
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 border-b-2 px-1 pt-1 text-sm font-medium ${
                      isActive
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
              <SettingsDropdown />
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:block text-sm text-gray-600">
              {userEmail}
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
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
            <div className="border-t border-gray-200 pt-2">
              {/* Settings Section with Sub-menu */}
              <div>
                <button
                  onClick={() => setIsSettingsExpanded(!isSettingsExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md text-base font-medium text-gray-900 hover:bg-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Settings
                  </div>
                  <ChevronDown className={`h-5 w-5 transition-transform ${isSettingsExpanded ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Settings Sub-menu */}
                {isSettingsExpanded && (
                  <div className="ml-4 mt-1 space-y-1">
                    <Link
                      href="/admin/settings"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === '/admin/settings'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4" />
                      General
                    </Link>
                    <Link
                      href="/admin/sop-types"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === '/admin/sop-types'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <FileText className="h-4 w-4" />
                      SOP Types
                    </Link>
                    <Link
                      href="/admin/quotes"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === '/admin/quotes'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Quote className="h-4 w-4" />
                      Quotes
                    </Link>
                    <Link
                      href="/admin/invite-codes"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === '/admin/invite-codes'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Ticket className="h-4 w-4" />
                      Invite Codes
                    </Link>
                    <Link
                      href="/admin/economic-calendar"
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${
                        pathname === '/admin/economic-calendar'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Calendar className="h-4 w-4" />
                      Calendar Settings
                    </Link>
                  </div>
                )}
              </div>
              
              <div className="border-t border-gray-200 mt-2 pt-2">
                <div className="px-3 py-2 text-sm text-gray-600">
                  {userEmail}
                </div>
                <Link
                  href="/api/auth/signout"
                  className="flex items-center gap-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Sign out
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
