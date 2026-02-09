'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SignOutButton } from '@/components/auth/SignOutButton';

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

function NavLink({ href, children, className = '' }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + '/');
  
  return (
    <Link 
      href={href} 
      className={`text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        isActive ? 'bg-gray-100 text-gray-900' : ''
      } ${className}`}
    >
      {children}
    </Link>
  );
}

interface NavDropdownProps {
  label: string;
  icon?: string;
  items: Array<{ href: string; label: string; icon?: string }>;
}

function NavDropdown({ label, icon, items }: NavDropdownProps) {
  const pathname = usePathname();
  const isActive = items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex items-center gap-1 text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px] touch-manipulation ${
        isActive ? 'bg-gray-100 text-gray-900' : ''
      }`}>
        {icon && <span>{icon}</span>}
        <span>{label}</span>
        <ChevronDown className="h-3 w-3" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} asChild>
            <Link href={item.href} className="w-full cursor-pointer">
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DesktopNav() {
  return (
    <div className="hidden lg:flex items-center space-x-1">
      <NavLink href="/dashboard">🏠 Dashboard</NavLink>
      <NavLink href="/trades">💹 Trades</NavLink>
      <NavLink href="/discipline-tracker">🛡️ Discipline</NavLink>
      
      <NavDropdown
        label="Performance"
        icon="📈"
        items={[
          { href: '/dashboard/achievements', label: 'Achievements', icon: '🏆' },
          { href: '/targets', label: 'Targets', icon: '🎯' },
          { href: '/analytics/trends', label: 'Analytics', icon: '📈' },
        ]}
      />
      
      <NavDropdown
        label="Resources"
        icon="📚"
        items={[
          { href: '/strategies', label: 'Strategies', icon: '📖' },
          { href: '/calendar', label: 'Calendar', icon: '📅' },
        ]}
      />
      
      <NavLink href="/settings">⚙️ Settings</NavLink>
    </div>
  );
}

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="lg:hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100"
        aria-label="Toggle menu"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b shadow-lg z-50">
          <div className="container mx-auto px-4 py-4 space-y-2">
            <NavLink href="/dashboard" className="block">🏠 Dashboard</NavLink>
            <NavLink href="/trades" className="block">💹 Trades</NavLink>
            <NavLink href="/discipline-tracker" className="block">🛡️ Discipline</NavLink>
            
            <div className="border-t pt-2 mt-2">
              <div className="text-xs font-semibold text-gray-500 px-3 mb-2">Performance</div>
              <NavLink href="/dashboard/achievements" className="block pl-6">🏆 Achievements</NavLink>
              <NavLink href="/targets" className="block pl-6">🎯 Targets</NavLink>
              <NavLink href="/analytics/trends" className="block pl-6">📈 Analytics</NavLink>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <div className="text-xs font-semibold text-gray-500 px-3 mb-2">Resources</div>
              <NavLink href="/strategies" className="block pl-6">📖 Strategies</NavLink>
              <NavLink href="/calendar" className="block pl-6">📅 Calendar</NavLink>
            </div>
            
            <div className="border-t pt-2 mt-2">
              <NavLink href="/settings" className="block">⚙️ Settings</NavLink>
              <SignOutButton
                className="block w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 hover:text-red-700 font-medium"
              >
                🚪 Sign Out
              </SignOutButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
