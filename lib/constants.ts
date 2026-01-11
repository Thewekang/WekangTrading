/**
 * Constants for WekangTradingJournal
 * Single Source of Truth (SSOT) for all constants
 */

// Default Timezone
export const DEFAULT_TIMEZONE = 'Asia/Kuala_Lumpur'; // GMT+8 Malaysia
export const TIMEZONE_OFFSET = 8; // Hours from UTC

// Market Session Hours (UTC)
// Note: Malaysia Time (MYT) = UTC + 8 hours
export const SESSION_HOURS = {
  ASIA: { start: 0, end: 9 },      // 00:00 - 09:00 UTC = 08:00 - 17:00 MYT
  EUROPE: { start: 7, end: 16 },    // 07:00 - 16:00 UTC = 15:00 - 00:00 MYT
  US: { start: 13, end: 22 },       // 13:00 - 22:00 UTC = 21:00 - 06:00 MYT
} as const;

// Overlap Detection
export const OVERLAP_HOURS = {
  ASIA_EUROPE: { start: 7, end: 9 },    // 07:00 - 09:00 UTC = 15:00 - 17:00 MYT
  EUROPE_US: { start: 13, end: 16 },     // 13:00 - 16:00 UTC = 21:00 - 00:00 MYT
} as const;

// Pagination
export const PAGINATION = {
  TRADES_PER_PAGE: 50,
  MAX_BULK_INSERT: 100,
  PAGINATION_PAGE_SIZE: 50,
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 8,
  MAX_NOTE_LENGTH: 500,
  MAX_NAME_LENGTH: 100,
} as const;

// API Response Codes
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM d, yyyy',
  DISPLAY_DATETIME: 'MMM d, yyyy h:mm a',
  API_DATE: 'yyyy-MM-dd',
  API_DATETIME: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
} as const;
