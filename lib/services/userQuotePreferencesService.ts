/**
 * User Quote Preferences Service
 * Manages user-specific quote settings and state
 */

import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// ============================================
// USER QUOTE PREFERENCES
// ============================================

export interface UserQuotePreferences {
  showQuotes: boolean;
  quotesCooldownMinutes: number;
  lastQuoteShownAt: Date | null;
  lastQuoteId: string | null;
  lastQuoteLanguage: 'en' | 'bm';
  quoteShowCount: number;
}

/**
 * Get user's quote preferences
 */
export async function getUserQuotePreferences(
  userId: string
): Promise<UserQuotePreferences | null> {
  const user = await db.select({
    showQuotes: users.showQuotes,
    quotesCooldownMinutes: users.quotesCooldownMinutes,
    lastQuoteShownAt: users.lastQuoteShownAt,
    lastQuoteId: users.lastQuoteId,
    lastQuoteLanguage: users.lastQuoteLanguage,
    quoteShowCount: users.quoteShowCount,
  })
  .from(users)
  .where(eq(users.id, userId))
  .get();

  if (!user) return null;

  return {
    showQuotes: user.showQuotes ?? true,
    quotesCooldownMinutes: user.quotesCooldownMinutes ?? 15,
    lastQuoteShownAt: user.lastQuoteShownAt,
    lastQuoteId: user.lastQuoteId,
    lastQuoteLanguage: (user.lastQuoteLanguage as 'en' | 'bm') ?? 'en',
    quoteShowCount: user.quoteShowCount ?? 0,
  };
}

/**
 * Update user's quote preferences
 */
export async function updateQuotePreferences(
  userId: string,
  preferences: Partial<UserQuotePreferences>
) {
  await db.update(users)
    .set(preferences)
    .where(eq(users.id, userId));
}

// ============================================
// COOLDOWN LOGIC
// ============================================

/**
 * Check if user can see a quote (cooldown + preferences check)
 */
export async function canShowQuote(userId: string): Promise<{
  canShow: boolean;
  reason?: string;
}> {
  const prefs = await getUserQuotePreferences(userId);
  
  if (!prefs) {
    return { canShow: false, reason: 'User not found' };
  }

  // Check if quotes are enabled
  if (!prefs.showQuotes) {
    return { canShow: false, reason: 'Quotes disabled by user' };
  }

  // Check cooldown
  if (prefs.lastQuoteShownAt) {
    const now = new Date();
    const lastShown = new Date(prefs.lastQuoteShownAt);
    const minutesSinceLastQuote = (now.getTime() - lastShown.getTime()) / (1000 * 60);
    
    if (minutesSinceLastQuote < prefs.quotesCooldownMinutes) {
      const remainingMinutes = Math.ceil(prefs.quotesCooldownMinutes - minutesSinceLastQuote);
      return { 
        canShow: false, 
        reason: `Cooldown active. ${remainingMinutes} minutes remaining.` 
      };
    }
  }

  return { canShow: true };
}

// ============================================
// LANGUAGE ROTATION
// ============================================

/**
 * Get next language to show (alternates EN <-> BM)
 */
export async function getNextQuoteLanguage(userId: string): Promise<'en' | 'bm'> {
  const prefs = await getUserQuotePreferences(userId);
  
  if (!prefs) return 'en';

  // Alternate from last shown
  return prefs.lastQuoteLanguage === 'en' ? 'bm' : 'en';
}

// ============================================
// QUOTE DISPLAY TRACKING
// ============================================

/**
 * Update user state after showing a quote
 */
export async function updateLastQuoteShown(
  userId: string,
  quoteId: string,
  language: 'en' | 'bm'
) {
  const prefs = await getUserQuotePreferences(userId);
  
  await db.update(users)
    .set({
      lastQuoteShownAt: new Date(),
      lastQuoteId: quoteId,
      lastQuoteLanguage: language,
      quoteShowCount: (prefs?.quoteShowCount ?? 0) + 1,
    })
    .where(eq(users.id, userId));
}

/**
 * Reset quote show count (for new session or manual reset)
 */
export async function resetQuoteShowCount(userId: string) {
  await db.update(users)
    .set({ quoteShowCount: 0 })
    .where(eq(users.id, userId));
}

// ============================================
// SESSION MANAGEMENT
// ============================================

const MAX_QUOTES_PER_SESSION = 5;

/**
 * Check if user has reached session quote limit
 */
export async function hasReachedSessionLimit(userId: string): Promise<boolean> {
  const prefs = await getUserQuotePreferences(userId);
  
  if (!prefs) return false;

  return prefs.quoteShowCount >= MAX_QUOTES_PER_SESSION;
}

/**
 * Get remaining quotes for current session
 */
export async function getRemainingQuotesForSession(userId: string): Promise<number> {
  const prefs = await getUserQuotePreferences(userId);
  
  if (!prefs) return MAX_QUOTES_PER_SESSION;

  const remaining = MAX_QUOTES_PER_SESSION - prefs.quoteShowCount;
  return Math.max(0, remaining);
}
