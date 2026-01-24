'use client';

import { createContext, useContext } from 'react';
import { formatDateInTimezone, getCurrentTimeInTimezone, toDatetimeLocal, datetimeLocalToUTC } from '@/lib/utils/timezones';

// ============================================
// TIMEZONE CONTEXT
// ============================================

interface TimezoneContextType {
  timezone: string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  getCurrentTime: () => string;
  toDatetimeLocal: (date: Date) => string;
  datetimeLocalToUTC: (datetimeLocalValue: string) => Date;
}

const TimezoneContext = createContext<TimezoneContextType | null>(null);

// ============================================
// TIMEZONE PROVIDER
// ============================================

interface TimezoneProviderProps {
  children: React.ReactNode;
  userTimezone: string;
}

export function TimezoneProvider({ children, userTimezone }: TimezoneProviderProps) {
  const value: TimezoneContextType = {
    timezone: userTimezone,
    formatDate: (date, options) => formatDateInTimezone(date, userTimezone, options),
    getCurrentTime: () => getCurrentTimeInTimezone(userTimezone),
    toDatetimeLocal: (date) => toDatetimeLocal(date, userTimezone),
    datetimeLocalToUTC: (datetimeLocalValue) => datetimeLocalToUTC(datetimeLocalValue, userTimezone),
  };

  return (
    <TimezoneContext.Provider value={value}>
      {children}
    </TimezoneContext.Provider>
  );
}

// ============================================
// TIMEZONE HOOK
// ============================================

export function useTimezone() {
  const context = useContext(TimezoneContext);
  
  if (!context) {
    throw new Error('useTimezone must be used within TimezoneProvider');
  }
  
  return context;
}
