import { db } from '@/lib/db';
import {
  disciplineTrackerSettings,
  disciplineTrackerRows,
  type DisciplineTrackerSettings,
  type NewDisciplineTrackerSettings,
  type DisciplineTrackerRow,
  type NewDisciplineTrackerRow,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, asc, sql, like } from 'drizzle-orm';
import type { DisciplineTrackerFilter } from '@/lib/validations/disciplineTracker';

/**
 * DISCIPLINE TRACKER SERVICE
 * 
 * Handles all database operations for the discipline tracker feature
 */

// ============================================
// SETTINGS OPERATIONS
// ============================================

/**
 * Get user's discipline tracker settings
 * Creates default settings if none exist
 */
export async function getUserSettings(userId: string): Promise<DisciplineTrackerSettings> {
  const settings = await db
    .select()
    .from(disciplineTrackerSettings)
    .where(eq(disciplineTrackerSettings.userId, userId))
    .limit(1);

  if (settings.length === 0) {
    // Create default settings
    const newSettings: NewDisciplineTrackerSettings = {
      userId,
      maxTradesPerDay: 2,
      slValue: -80,
      beValue: 0,
      tp1Value: 80,
      tp2Value: 160,
      tp3Mode: 'manual',
      tp3FixedValue: 240,
      winRateFormula: 'excludeBE',
    };

    const created = await db.insert(disciplineTrackerSettings).values(newSettings).returning();
    return created[0];
  }

  return settings[0];
}

/**
 * Update user's discipline tracker settings
 */
export async function updateUserSettings(
  userId: string,
  updates: Partial<DisciplineTrackerSettings>
): Promise<DisciplineTrackerSettings> {
  const updated = await db
    .update(disciplineTrackerSettings)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(disciplineTrackerSettings.userId, userId))
    .returning();

  if (updated.length === 0) {
    throw new Error('Settings not found');
  }

  return updated[0];
}

// ============================================
// ROW OPERATIONS
// ============================================

/**
 * Get all rows for a user with optional filtering
 */
export async function getUserRows(
  userId: string,
  filter?: DisciplineTrackerFilter
): Promise<DisciplineTrackerRow[]> {
  let query = db.select().from(disciplineTrackerRows).where(eq(disciplineTrackerRows.userId, userId));

  // Apply month filter
  if (filter?.month) {
    const [year, month] = filter.month.split('-');
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    query = query.where(
      and(
        eq(disciplineTrackerRows.userId, userId),
        gte(disciplineTrackerRows.tradeDate, startDate),
        lte(disciplineTrackerRows.tradeDate, endDate)
      )
    ) as any;
  }

  // Apply search filter
  if (filter?.search && filter.search.trim() !== '') {
    query = query.where(
      and(
        eq(disciplineTrackerRows.userId, userId),
        like(disciplineTrackerRows.notes, `%${filter.search}%`)
      )
    ) as any;
  }

  // Apply sorting
  const sortBy = filter?.sortBy || 'date-desc';
  if (sortBy === 'date-asc') {
    query = query.orderBy(asc(disciplineTrackerRows.tradeDate)) as any;
  } else if (sortBy === 'date-desc') {
    query = query.orderBy(desc(disciplineTrackerRows.tradeDate)) as any;
  }
  // Note: P&L sorting would require computation, handled in-memory

  const rows = await query;
  return rows as DisciplineTrackerRow[];
}

/**
 * Get a single row by ID
 */
export async function getRowById(userId: string, rowId: string): Promise<DisciplineTrackerRow | null> {
  const rows = await db
    .select()
    .from(disciplineTrackerRows)
    .where(and(eq(disciplineTrackerRows.id, rowId), eq(disciplineTrackerRows.userId, userId)))
    .limit(1);

  return rows.length > 0 ? rows[0] : null;
}

/**
 * Create a new row
 */
export async function createRow(
  userId: string,
  data: Omit<NewDisciplineTrackerRow, 'userId'>
): Promise<DisciplineTrackerRow> {
  const newRow: NewDisciplineTrackerRow = {
    ...data,
    userId,
  };

  const created = await db.insert(disciplineTrackerRows).values(newRow).returning();
  return created[0];
}

/**
 * Update an existing row
 */
export async function updateRow(
  userId: string,
  rowId: string,
  updates: Partial<DisciplineTrackerRow>
): Promise<DisciplineTrackerRow> {
  const updated = await db
    .update(disciplineTrackerRows)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(and(eq(disciplineTrackerRows.id, rowId), eq(disciplineTrackerRows.userId, userId)))
    .returning();

  if (updated.length === 0) {
    throw new Error('Row not found');
  }

  return updated[0];
}

/**
 * Delete a row
 */
export async function deleteRow(userId: string, rowId: string): Promise<void> {
  const result = await db
    .delete(disciplineTrackerRows)
    .where(and(eq(disciplineTrackerRows.id, rowId), eq(disciplineTrackerRows.userId, userId)))
    .returning();

  if (result.length === 0) {
    throw new Error('Row not found');
  }
}

/**
 * Check if a date already exists for a user
 */
export async function dateExists(userId: string, tradeDate: Date, excludeId?: string): Promise<boolean> {
  // Normalize to start of day
  const startOfDay = new Date(tradeDate);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(tradeDate);
  endOfDay.setHours(23, 59, 59, 999);

  let query = db
    .select({ id: disciplineTrackerRows.id })
    .from(disciplineTrackerRows)
    .where(
      and(
        eq(disciplineTrackerRows.userId, userId),
        gte(disciplineTrackerRows.tradeDate, startOfDay),
        lte(disciplineTrackerRows.tradeDate, endOfDay)
      )
    );

  // Exclude specific row if updating
  if (excludeId) {
    query = query.where(
      and(
        eq(disciplineTrackerRows.userId, userId),
        gte(disciplineTrackerRows.tradeDate, startOfDay),
        lte(disciplineTrackerRows.tradeDate, endOfDay),
        sql`${disciplineTrackerRows.id} != ${excludeId}`
      )
    ) as any;
  }

  const existing = await query.limit(1);
  return existing.length > 0;
}
