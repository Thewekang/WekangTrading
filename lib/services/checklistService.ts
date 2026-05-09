import { eq, and, gte, lt } from 'drizzle-orm';
import { db } from '../db';
import { tradingDayChecklists } from '../db/schema/checklist';
import { economicEvents } from '../db/schema/economicEvents';
import { ALL_CHECKLIST_KEYS } from '../constants';
import type { ItemState, ItemStates, UpdateChecklistInput } from '../validations';
import type { EconomicEvent } from '../db/schema/economicEvents';

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Build a fresh itemStates object with all known checklist keys
 * initialised to { checked: false, remark: '' }.
 */
function buildInitialItemStates(): ItemStates {
  const states: ItemStates = {};
  for (const key of ALL_CHECKLIST_KEYS) {
    states[key] = { checked: false, remark: '' };
  }
  return states;
}

/**
 * Parse raw JSON string from the DB into a typed ItemStates map,
 * merging with defaults so new keys are always present.
 */
function parseItemStates(raw: string): ItemStates {
  let parsed: Record<string, unknown> = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    // fall through — use defaults
  }

  const defaults = buildInitialItemStates();
  for (const key of ALL_CHECKLIST_KEYS) {
    const val = parsed[key];
    if (val && typeof val === 'object' && 'checked' in val) {
      const v = val as Record<string, unknown>;
      defaults[key] = {
        checked: Boolean(v['checked']),
        remark: typeof v['remark'] === 'string' ? v['remark'] : '',
      };
    }
  }
  return defaults;
}

// ============================================
// SERVICE FUNCTIONS
// ============================================

/**
 * Get or create a checklist for a given (account, user, tradeDate).
 * Returns the checklist with itemStates parsed as a typed object.
 */
export async function getOrCreateChecklist(
  accountId: string,
  userId: string,
  tradeDate: string, // 'YYYY-MM-DD' in account timezone
) {
  const existing = await db
    .select()
    .from(tradingDayChecklists)
    .where(
      and(
        eq(tradingDayChecklists.tradingAccountId, accountId),
        eq(tradingDayChecklists.userId, userId),
        eq(tradingDayChecklists.tradeDate, tradeDate),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    const row = existing[0];
    return {
      ...row,
      itemStates: parseItemStates(row.itemStates),
    };
  }

  // Create new checklist with all items initialised
  const initialStates = buildInitialItemStates();
  const newRow = {
    userId,
    tradingAccountId: accountId,
    tradeDate,
    itemStates: JSON.stringify(initialStates),
  };

  const [created] = await db
    .insert(tradingDayChecklists)
    .values(newRow)
    .returning();

  return {
    ...created,
    itemStates: initialStates,
  };
}

/**
 * Merge-update itemStates for an existing checklist.
 * Only the keys present in the patch are updated; others are preserved.
 */
export async function updateChecklist(
  accountId: string,
  userId: string,
  tradeDate: string,
  patch: UpdateChecklistInput,
) {
  const row = await db
    .select()
    .from(tradingDayChecklists)
    .where(
      and(
        eq(tradingDayChecklists.tradingAccountId, accountId),
        eq(tradingDayChecklists.userId, userId),
        eq(tradingDayChecklists.tradeDate, tradeDate),
      ),
    )
    .limit(1);

  if (row.length === 0) {
    // Auto-create if not yet present
    return getOrCreateChecklist(accountId, userId, tradeDate);
  }

  const current = parseItemStates(row[0].itemStates);
  const merged: ItemStates = { ...current };

  for (const [key, state] of Object.entries(patch.itemStates) as [string, ItemState][]) {
    merged[key] = {
      checked: state.checked,
      remark: state.remark ?? '',
    };
  }

  const now = new Date();
  const [updated] = await db
    .update(tradingDayChecklists)
    .set({
      itemStates: JSON.stringify(merged),
      updatedAt: now,
    })
    .where(
      and(
        eq(tradingDayChecklists.tradingAccountId, accountId),
        eq(tradingDayChecklists.userId, userId),
        eq(tradingDayChecklists.tradeDate, tradeDate),
      ),
    )
    .returning();

  return {
    ...updated,
    itemStates: merged,
  };
}

/**
 * Reset a checklist to all-unchecked state for a given date.
 * Creates the row if it does not yet exist (idempotent).
 */
export async function resetChecklist(
  accountId: string,
  userId: string,
  tradeDate: string,
) {
  const fresh = buildInitialItemStates();
  const now = new Date();

  // Upsert: delete any existing row and re-insert (SQLite ON CONFLICT won't work cleanly here)
  await db
    .update(tradingDayChecklists)
    .set({ itemStates: JSON.stringify(fresh), updatedAt: now })
    .where(
      and(
        eq(tradingDayChecklists.tradingAccountId, accountId),
        eq(tradingDayChecklists.userId, userId),
        eq(tradingDayChecklists.tradeDate, tradeDate),
      ),
    );

  // Fetch the updated row (or create fresh if no row existed)
  return getOrCreateChecklist(accountId, userId, tradeDate);
}

/**
 * Get today's HIGH-impact economic events for the given date string (YYYY-MM-DD UTC).
 * We treat the date boundaries as UTC midnight → next UTC midnight to keep it simple
 * (economic calendars typically use UTC dates).
 */
export async function getTodayHighImpactNews(dateStr: string): Promise<EconomicEvent[]> {
  const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
  const endOfDay = new Date(`${dateStr}T23:59:59.999Z`);

  const events = await db
    .select()
    .from(economicEvents)
    .where(
      and(
        eq(economicEvents.importance, 'HIGH'),
        gte(economicEvents.eventDate, startOfDay),
        lt(economicEvents.eventDate, endOfDay),
      ),
    );

  return events;
}
