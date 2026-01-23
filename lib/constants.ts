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

// Badge Categories
export const BADGE_CATEGORIES = {
  VOLUME: 'VOLUME',
  STREAK: 'STREAK',
  PROFIT: 'PROFIT',
  CONSISTENCY: 'CONSISTENCY',
  SOP: 'SOP',
  PERFORMANCE: 'PERFORMANCE',
  SPECIAL: 'SPECIAL',
} as const;

// Badge Tiers
export const BADGE_TIERS = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
} as const;

// Streak Types
export const STREAK_TYPES = {
  WIN_STREAK: 'WIN_STREAK',
  LOG_STREAK: 'LOG_STREAK',
  SOP_STREAK: 'SOP_STREAK',
} as const;

// Message Types
export const MESSAGE_TYPES = {
  ACHIEVEMENT: 'ACHIEVEMENT',
  STREAK: 'STREAK',
  MILESTONE: 'MILESTONE',
  ENCOURAGEMENT: 'ENCOURAGEMENT',
  PERFORMANCE: 'PERFORMANCE',
  CELEBRATION: 'CELEBRATION',
  REMINDER: 'REMINDER',
} as const;

// Badge Colors (Tailwind classes)
export const BADGE_COLORS = {
  BRONZE: {
    bg: 'bg-amber-100',
    border: 'border-amber-500',
    text: 'text-amber-700',
    glow: 'shadow-amber-200',
  },
  SILVER: {
    bg: 'bg-slate-100',
    border: 'border-slate-400',
    text: 'text-slate-700',
    glow: 'shadow-slate-200',
  },
  GOLD: {
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-700',
    glow: 'shadow-yellow-200',
  },
  PLATINUM: {
    bg: 'bg-gradient-to-br from-purple-100 to-pink-100',
    border: 'border-purple-500',
    text: 'text-purple-700',
    glow: 'shadow-purple-300',
  },
  LOCKED: {
    bg: 'bg-gray-100',
    border: 'border-gray-300',
    text: 'text-gray-400',
    opacity: 'opacity-50',
  },
} as const;
