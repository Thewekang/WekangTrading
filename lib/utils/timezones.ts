// ============================================
// TIMEZONE UTILITIES
// ============================================

/**
 * Common timezones for quick selection
 * IANA format with user-friendly labels
 */
export const COMMON_TIMEZONES = [
  { value: 'Asia/Kuala_Lumpur', label: 'Malaysia (MYT) - Default' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (EST/EDT)' },
  { value: 'America/Chicago', label: 'Central Time (CST/CDT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PST/PDT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET/CEST)' },
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
/**
 * Convert datetime-local input value to UTC Date
 * Interprets the input as being in the specified timezone
 * 
 * @param datetimeLocalValue - "2026-01-24T14:30" format from datetime-local input
 * @param timezone - IANA timezone (e.g., "Asia/Kuala_Lumpur")
 * @returns Date object in UTC
 */
export function datetimeLocalToUTC(datetimeLocalValue: string, timezone: string): Date {
  // Parse the input value
  const [datePart, timePart] = datetimeLocalValue.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create a date string in ISO format that would represent this time in the target timezone
  // We need to find what UTC time corresponds to this local time in the target timezone
  
  // Step 1: Create an ISO string with the local time components
  const localTimeStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
  
  // Step 2: Parse this as if it were in the target timezone by using a reverse calculation
  // Create a date assuming UTC, then adjust for the timezone offset
  const utcGuess = new Date(`${localTimeStr}Z`); // Parse as UTC
  
  // Step 3: Get the offset of the target timezone at this approximate time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Format the UTC guess in the target timezone to see what local time it would be
  const parts = formatter.formatToParts(utcGuess);
  const tzYear = parseInt(parts.find(p => p.type === 'year')?.value || '0');
  const tzMonth = parseInt(parts.find(p => p.type === 'month')?.value || '0');
  const tzDay = parseInt(parts.find(p => p.type === 'day')?.value || '0');
  const tzHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const tzMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const tzSecond = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  
  // Step 4: Calculate the difference between our target time and what the UTC guess gave us
  const targetTime = Date.UTC(year, month - 1, day, hours, minutes, 0);
  const actualTzTime = Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, tzSecond);
  const offset = targetTime - actualTzTime;
  
  // Step 5: Apply the offset to get the correct UTC time
  const correctUtc = new Date(utcGuess.getTime() + offset);
  
  return correctUtc;
}