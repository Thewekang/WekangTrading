/**
 * Admin Settings Service
 * DB-backed key-value store for system-wide configurable constants.
 * Replaces hardcoded values scattered across services.
 *
 * Known keys:
 *   'min_trades_for_ranking'     → integer, default 10
 *   'ranking_cache_duration_ms'  → integer, default 3600000 (1 hour)
 */

import { db } from '../db';
import { adminSettings } from '../db/schema';
import { eq } from 'drizzle-orm';

// ============================================
// DEFAULT VALUES (fallback when key not in DB)
// ============================================

const DEFAULTS: Record<string, string> = {
  min_trades_for_ranking: '10',
  ranking_cache_duration_ms: '3600000',
};

// ============================================
// QUERIES
// ============================================

/** Returns a setting value as string, or the default if not set. */
export async function getSetting(key: string): Promise<string> {
  const [row] = await db
    .select({ value: adminSettings.value })
    .from(adminSettings)
    .where(eq(adminSettings.key, key))
    .limit(1);

  return row?.value ?? DEFAULTS[key] ?? '';
}

/** Returns a setting value parsed as integer. */
export async function getSettingInt(key: string): Promise<number> {
  const val = await getSetting(key);
  return parseInt(val, 10);
}

/** Returns all admin settings rows. */
export async function getAllSettings() {
  return db.select().from(adminSettings).orderBy(adminSettings.key);
}

// ============================================
// MUTATIONS
// ============================================

/** Upserts a single admin setting. Only admins should call this. */
export async function setSetting(key: string, value: string, updatedBy: string, description?: string) {
  const existing = await db
    .select({ key: adminSettings.key })
    .from(adminSettings)
    .where(eq(adminSettings.key, key))
    .limit(1);

  if (existing.length > 0) {
    const [updated] = await db
      .update(adminSettings)
      .set({ value, updatedBy, ...(description !== undefined && { description }) })
      .where(eq(adminSettings.key, key))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(adminSettings)
    .values({ key, value, description: description ?? null, updatedBy })
    .returning();

  return created;
}
