import { z } from 'zod';

/**
 * Trade outcome enum
 */
export const tradeOutcomeEnum = z.enum(['', 'TP3', 'TP2', 'TP1', 'BE', 'SL']);
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
  tradeDate: z.date(),
  notes: z.string().max(500).optional().default(''),
  trade1Outcome: tradeOutcomeEnum.default(''),
  trade2Outcome: tradeOutcomeEnum.default(''),
  trade3Outcome: tradeOutcomeEnum.default(''),
  trade1Tp3Amount: z.number().optional().default(0),
  trade2Tp3Amount: z.number().optional().default(0),
  trade3Tp3Amount: z.number().optional().default(0),
  aplusConfirmed: z.boolean().default(false),
  rangeExpansionConfirmed: z.boolean().default(false),
  sessionWindow: sessionWindowEnum.default('non-prime'),
});

export type DisciplineTrackerRowInput = z.infer<typeof disciplineTrackerRowSchema>;

/**
 * Update schemas (all fields optional)
 */
export const updateDisciplineTrackerSettingsSchema = disciplineTrackerSettingsSchema.partial();
export const updateDisciplineTrackerRowSchema = disciplineTrackerRowSchema.partial();

/**
 * Filter schema
 */
export const disciplineTrackerFilterSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(), // YYYY-MM format
  search: z.string().optional(),
  sortBy: z.enum(['date-asc', 'date-desc', 'pnl-asc', 'pnl-desc']).optional().default('date-desc'),
});

export type DisciplineTrackerFilter = z.infer<typeof disciplineTrackerFilterSchema>;
