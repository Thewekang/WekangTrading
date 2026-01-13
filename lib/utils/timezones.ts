// ============================================
// TIMEZONE UTILITIES
// ============================================

/**
 * Common timezones for quick selection
 * IANA format with user-friendly labels
 */
export const COMMON_TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET/CEST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia (MYT)' },
  { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEDT/AEST)' },
] as const;

/**
 * Get all supported timezones from browser
 * Returns IANA timezone identifiers
 */
export function getAllTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    // Fallback for older browsers
    return COMMON_TIMEZONES.map(tz => tz.value);
  }
}

/**
 * Validate if timezone is valid IANA identifier
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

/**
 * Format date in user's timezone
 * Uses Intl.DateTimeFormat for accurate timezone conversion
 */
export function formatDateInTimezone(
  date: Date | string | number,
  timezone: string,
  options: Intl.DateTimeFormatOptions = {}
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
    ...options,
  };

  return new Intl.DateTimeFormat('en-US', defaultOptions).format(dateObj);
}

/**
 * Get current time in specific timezone
 */
export function getCurrentTimeInTimezone(timezone: string): string {
  return formatDateInTimezone(new Date(), timezone, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Convert date to UTC timestamp (for storage)
 * Ensures consistent storage regardless of user timezone
 */
export function toUTCTimestamp(date: Date): Date {
  return new Date(date.toISOString());
}

/**
 * Parse datetime-local input value to Date object
 * datetime-local format: "2026-01-12T08:30"
 */
export function parseDatetimeLocal(value: string): Date {
  return new Date(value);
}

/**
 * Format Date to datetime-local input value
 * datetime-local format: "2026-01-12T08:30"
 */
export function toDatetimeLocal(date: Date, timezone: string): string {
  // Format in user's timezone
  const formatter = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: timezone,
  });
  
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  const hour = parts.find(p => p.type === 'hour')?.value;
  const minute = parts.find(p => p.type === 'minute')?.value;
  
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Get timezone offset string (e.g., "GMT+8", "GMT-5")
 */
export function getTimezoneOffset(timezone: string): string {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    timeZoneName: 'shortOffset',
  });
  
  const parts = formatter.formatToParts(now);
  const offsetPart = parts.find(p => p.type === 'timeZoneName');
  return offsetPart?.value || 'UTC';
}
