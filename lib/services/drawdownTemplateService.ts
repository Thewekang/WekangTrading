/**
 * Drawdown Template Service
 * Admin-managed presets that users can apply when creating/editing an account's rules.
 */

import { db } from '../db';
import { drawdownTemplates } from '../db/schema';
import { eq } from 'drizzle-orm';

// ============================================
// TYPES
// ============================================

export interface CreateTemplateInput {
  name: string;
  accountType?: 'PROP_FIRM' | 'FUTURES' | 'CFD' | 'FOREX' | 'SHARE' | 'DEMO' | null;
  dailyDrawdownPct?: number | null;
  totalDrawdownPct?: number | null;
  consistencyTargetPct?: number | null;
  targetGainPct?: number | null;
  isDefault?: boolean;
}

// ============================================
// QUERIES
// ============================================

/** Returns all drawdown templates (admin view). */
export async function getAllTemplates() {
  return db
    .select()
    .from(drawdownTemplates)
    .orderBy(drawdownTemplates.isDefault, drawdownTemplates.name);
}

/**
 * Returns templates applicable to a given account type
 * (includes templates with no accountType filter — universal templates).
 */
export async function getTemplatesForAccountType(
  accountType: 'PROP_FIRM' | 'FUTURES' | 'CFD' | 'FOREX' | 'SHARE' | 'DEMO'
) {
  const all = await getAllTemplates();
  return all.filter((t) => t.accountType == null || t.accountType === accountType);
}

/** Returns a single template by id. */
export async function getTemplate(id: string) {
  const [template] = await db
    .select()
    .from(drawdownTemplates)
    .where(eq(drawdownTemplates.id, id))
    .limit(1);
  return template ?? null;
}

// ============================================
// MUTATIONS
// ============================================

export async function createTemplate(input: CreateTemplateInput) {
  const [created] = await db
    .insert(drawdownTemplates)
    .values({
      name: input.name,
      accountType: input.accountType ?? null,
      dailyDrawdownPct: input.dailyDrawdownPct ?? null,
      totalDrawdownPct: input.totalDrawdownPct ?? null,
      consistencyTargetPct: input.consistencyTargetPct ?? null,
      targetGainPct: input.targetGainPct ?? null,
      isDefault: input.isDefault ?? false,
    })
    .returning();
  return created;
}

export async function updateTemplate(id: string, input: Partial<CreateTemplateInput>) {
  const [updated] = await db
    .update(drawdownTemplates)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.accountType !== undefined && { accountType: input.accountType }),
      ...(input.dailyDrawdownPct !== undefined && { dailyDrawdownPct: input.dailyDrawdownPct }),
      ...(input.totalDrawdownPct !== undefined && { totalDrawdownPct: input.totalDrawdownPct }),
      ...(input.consistencyTargetPct !== undefined && { consistencyTargetPct: input.consistencyTargetPct }),
      ...(input.targetGainPct !== undefined && { targetGainPct: input.targetGainPct }),
      ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
    })
    .where(eq(drawdownTemplates.id, id))
    .returning();
  return updated ?? null;
}

export async function deleteTemplate(id: string) {
  await db.delete(drawdownTemplates).where(eq(drawdownTemplates.id, id));
}
