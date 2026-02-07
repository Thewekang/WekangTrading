import { z } from 'zod';

/**
 * Trade outcome enum
 */
export const tradeOutcomeEnum = z.enum(['', 'EMPTY', 'TP3', 'TP2', 'TP1', 'BE', 'SL']);
export type TradeOutcome = z.infer<typeof tradeOutcomeEnum>;

/**
 * Session window enum
 */
export const sessionWindowEnum = z.enum(['prime', 'non-prime']);
export type SessionWindow = z.infer<typeof sessionWindowEnum>;

/**
 * TP3 mode enum
 */
export const tp3ModeEnum = z.enum(['manual', 'fixed']);
export type Tp3Mode = z.infer<typeof tp3ModeEnum>;

/**
 * Win rate formula enum
 */
export const winRateFormulaEnum = z.enum(['excludeBE', 'includeBE']);
export type WinRateFormula = z.infer<typeof winRateFormulaEnum>;

/**
 * Discipline Tracker Settings Schema
 */
export const disciplineTrackerSettingsSchema = z.object({
  maxTradesPerDay: z.number().int().min(1).max(10).default(2),
  slValue: z.number().negative().default(-80),
  beValue: z.number().default(0),
  tp1Value: z.number().positive().default(80),
  tp2Value: z.number().positive().default(160),
  tp3Mode: tp3ModeEnum.default('manual'),
  tp3FixedValue: z.number().positive().optional().default(240),
  winRateFormula: winRateFormulaEnum.default('excludeBE'),
});

export type DisciplineTrackerSettingsInput = z.infer<typeof disciplineTrackerSettingsSchema>;

/**
 * Discipline Tracker Row Schema
 */
export const disciplineTrackerRowSchema = z.object({
  tradeDate: z.string(), // YYYY-MM-DD format
  notes: z.string().max(500).optional(),
  sessionWindow: sessionWindowEnum.default('non-prime'),
  isAPlusDay: z.boolean().default(false),
  isRangeExpansionDay: z.boolean().default(false),
});

export type DisciplineTrackerRowInput = z.infer<typeof disciplineTrackerRowSchema>;

/**
 * Update schema for row (includes all editable fields)
 */
export const updateDisciplineTrackerRowSchema = z.object({
  tradeDate: z.date().optional(),
  notes: z.string().max(500).optional(),
  trade1Outcome: tradeOutcomeEnum.optional(),
  trade2Outcome: tradeOutcomeEnum.optional(),
  trade3Outcome: tradeOutcomeEnum.optional(),
  trade1Tp3Amount: z.number().optional(),
  trade2Tp3Amount: z.number().optional(),
  trade3Tp3Amount: z.number().optional(),
  isAPlusDay: z.boolean().optional(),
  isRangeExpansionDay: z.boolean().optional(),
  sessionWindow: sessionWindowEnum.optional(),
}).partial();

/**
 * Update schemas (all fields optional)
 */
export const updateDisciplineTrackerSettingsSchema = disciplineTrackerSettingsSchema.partial();

/**
 * Filter schema
 */
export const disciplineTrackerFilterSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM format
  search: z.string().optional(),
  sortBy: z.enum(['date-asc', 'date-desc', 'pnl-asc', 'pnl-desc']).optional().default('date-desc'),
});

export type DisciplineTrackerFilter = z.infer<typeof disciplineTrackerFilterSchema>;
