import { z } from 'zod';

// ============================================
// USER VALIDATION SCHEMAS
// ============================================

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  inviteCode: z.string().length(8, 'Invite code must be 8 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters').max(100, 'Password must be less than 100 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// ============================================
// INDIVIDUAL TRADE VALIDATION SCHEMAS
// ============================================

// Shared timestamp validation for form schemas
const formTimestamp = z.date().refine((date) => date <= new Date(), {
  message: 'Trade timestamp cannot be in the future',
});

// Shared timestamp validation for API schemas (string → Date transform)
const apiTimestamp = z
  .string()
  .min(1, 'Trade timestamp is required')
  .transform((val) => new Date(val))
  .refine((date) => !Number.isNaN(date.getTime()), {
    message: 'Trade timestamp is invalid',
  })
  .refine((date) => date <= new Date(), {
    message: 'Trade timestamp cannot be in the future',
  });

// Shared symbol validation
const symbolField = z.string()
  .min(2, 'Symbol must be at least 2 characters')
  .max(10, 'Symbol must be less than 10 characters')
  .regex(/^[A-Z0-9]+$/, 'Symbol must be uppercase letters and numbers only')
  .optional();

// Shared profit/loss validation — non-zero except for BE (break-even) trades
const profitLossField = z.number().refine((val) => val !== 0, {
  message: 'Amount cannot be zero (use BE result for break-even trades)',
});

// ─── FORM schemas (used by React Hook Form / client-side) ───────────────────

// Transaction trade form schema (full fields)
export const transactionTradeSchema = z.object({
  entryType: z.literal('TRANSACTION'),
  tradeTimestamp: formTimestamp,
  result: z.enum(['WIN', 'LOSS', 'BE']),
  sopFollowed: z.boolean(),
  sopTypeId: z.string().nullable().optional(),
  profitLossUsd: z.number(), // 0 allowed for BE (break-even) trades
  symbol: symbolField,
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Commission trade form schema (simplified — no result/SOP)
export const commissionTradeSchema = z.object({
  entryType: z.literal('COMMISSION'),
  tradeTimestamp: formTimestamp,
  profitLossUsd: z.number().positive('Commission amount must be positive').refine((val) => val !== 0, {
    message: 'Commission amount cannot be zero',
  }),
  symbol: symbolField,
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Discriminated union for form — use entryType to determine which schema to apply
export const individualTradeSchema = z.discriminatedUnion('entryType', [
  transactionTradeSchema,
  commissionTradeSchema,
]);

// ─── API schemas (used by API routes — include string→Date transform) ────────

// Transaction API schema
export const transactionTradeApiSchema = z.object({
  entryType: z.literal('TRANSACTION'),
  tradeTimestamp: apiTimestamp,
  result: z.enum(['WIN', 'LOSS', 'BE']),
  sopFollowed: z
    .union([z.boolean(), z.literal('true'), z.literal('false')])
    .transform((v) => (v === true || v === 'true')),
  sopTypeId: z.string().nullable().optional(),
  profitLossUsd: z.number(), // 0 is allowed for BE (break-even) trades
  symbol: symbolField,
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Commission API schema
export const commissionTradeApiSchema = z.object({
  entryType: z.literal('COMMISSION'),
  tradeTimestamp: apiTimestamp,
  profitLossUsd: z.number().positive('Commission amount must be positive').refine((val) => val !== 0, {
    message: 'Commission amount cannot be zero',
  }),
  symbol: symbolField,
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

// Discriminated union for API — validated at API route level
export const individualTradeApiSchema = z.discriminatedUnion('entryType', [
  transactionTradeApiSchema,
  commissionTradeApiSchema,
]);

// Legacy alias for backward compat (remove when all call sites updated)
export type TransactionTradeInput = z.infer<typeof transactionTradeSchema>;
export type CommissionTradeInput = z.infer<typeof commissionTradeSchema>;
// IndividualTradeInput is the union — also exported below for backward compat

export const bulkTradeEntrySchema = z.object({
  tradeDate: z.coerce.date().refine((date) => {
    // Allow dates up to +1 day from current date to accommodate timezone differences
    // Users in timezones ahead of UTC (e.g., UTC+8) may need to select "tomorrow" in UTC
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 1);
    maxDate.setHours(23, 59, 59, 999); // End of day
    return date <= maxDate;
  }, {
    message: 'Trade date cannot be more than 1 day in the future',
  }),
  trades: z.array(individualTradeApiSchema).min(1, 'At least one trade is required').max(100, 'Maximum 100 trades per bulk entry'),
}).refine((data) => {
  // All trades must be on the same date as tradeDate (use local date comparison)
  const tradeDateStr = data.tradeDate.toISOString().split('T')[0];
  return data.trades.every((trade) => {
    const timestamp = new Date(trade.tradeTimestamp);
    // Extract date in local timezone to avoid timezone conversion issues
    const year = timestamp.getFullYear();
    const month = String(timestamp.getMonth() + 1).padStart(2, '0');
    const day = String(timestamp.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;
    return localDateStr === tradeDateStr;
  });
}, {
  message: 'All trades must be on the same date',
  path: ['trades'],
});

// ============================================
// USER TARGET VALIDATION SCHEMAS
// ============================================

export const userTargetSchema = z.object({
  name: z.string().min(1, 'Target name is required').max(100, 'Name must be less than 100 characters'),
  targetCategory: z.enum(['PROP_FIRM', 'PERSONAL']),
  targetType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']),
  targetWinRate: z.number().min(0, 'Win rate must be at least 0%').max(100, 'Win rate cannot exceed 100%'),
  targetSopRate: z.number().min(0, 'SOP rate must be at least 0%').max(100, 'SOP rate cannot exceed 100%').optional(),
});

// ============================================
// USER PREFERENCES VALIDATION SCHEMAS
// ============================================

export const userPreferencesSchema = z.object({
  preferredTimezone: z.string()
    .min(1, 'Timezone is required')
    .refine(
      (tz) => {
        try {
          Intl.DateTimeFormat(undefined, { timeZone: tz });
          return true;
        } catch {
          return false;
        }
      },
      'Invalid timezone identifier'
    ),
});

// ============================================
// TYPES FROM SCHEMAS
// ============================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>;
export type IndividualTradeInput = z.infer<typeof individualTradeSchema>;
export type BulkTradeEntryInput = z.infer<typeof bulkTradeEntrySchema>;
export type UserTargetInput = z.infer<typeof userTargetSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
// ============================================
// TRADING ACCOUNT VALIDATION SCHEMAS
// ============================================

const accountTypeEnum = z.enum(['PROP_FIRM', 'FUTURES', 'CFD', 'FOREX', 'SHARE', 'DEMO']);

export const createTradingAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(100, 'Name must be less than 100 characters'),
  accountType: accountTypeEnum.default('FUTURES'),
  currency: z.string().min(1).max(10).default('USD'),
  startingBalance: z.number().min(0, 'Starting balance cannot be negative').default(0),
});

export const updateTradingAccountSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  accountType: accountTypeEnum.optional(),
  currency: z.string().min(1).max(10).optional(),
  startingBalance: z.number().min(0).optional(),
  active: z.boolean().optional(),
});

export const accountRulesSchema = z.object({
  dailyDrawdownPct: z.number().min(0.1).max(100).nullable().optional(),
  totalDrawdownPct: z.number().min(0.1).max(100).nullable().optional(),
  consistencyTargetPct: z.number().min(1).max(100).nullable().optional(),
  cycleTargetProfitUsd: z.number().min(0).nullable().optional(),
  dailyResetTimezone: z.string().optional(),
});

export const withdrawalEventSchema = z.object({
  withdrawalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  withdrawalAmount: z.number().positive('Withdrawal amount must be positive'),
  notes: z.string().max(500).optional(),
});

export const drawdownTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  accountType: accountTypeEnum.nullable().optional(),
  dailyDrawdownPct: z.number().min(0.1).max(100).nullable().optional(),
  totalDrawdownPct: z.number().min(0.1).max(100).nullable().optional(),
  consistencyTargetPct: z.number().min(1).max(100).nullable().optional(),
  targetGainPct: z.number().min(0.1).max(100).nullable().optional(),
  dailyResetTimezone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const adminSettingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string(),
  description: z.string().max(500).optional(),
});

// ============================================
// TYPES FROM NEW SCHEMAS
// ============================================

export type CreateTradingAccountInput = z.infer<typeof createTradingAccountSchema>;
export type UpdateTradingAccountInput = z.infer<typeof updateTradingAccountSchema>;
export type AccountRulesInput = z.infer<typeof accountRulesSchema>;
export type WithdrawalEventInput = z.infer<typeof withdrawalEventSchema>;
export type DrawdownTemplateInput = z.infer<typeof drawdownTemplateSchema>;
export type AdminSettingInput = z.infer<typeof adminSettingSchema>;

// ============================================
// STRATEGY PLAYBOOK VALIDATION SCHEMAS
// ============================================

const instrumentTypeEnum = z.enum(['FOREX', 'COMMODITY', 'INDEX', 'CRYPTO', 'FUTURES']);

export const createStrategySchema = z.object({
  symbol: z
    .string()
    .min(2, 'Symbol must be at least 2 characters')
    .max(20, 'Symbol must be less than 20 characters')
    .transform((v) => v.toUpperCase().trim()),
  instrumentType: instrumentTypeEnum,
  defaultLotSize: z.number().positive('Lot size must be positive').optional().nullable(),
  stopLossPoints: z.number().positive('SL must be positive').optional().nullable(),
  tp1Points: z.number().positive('TP1 must be positive').optional().nullable(),
  tp2Points: z.number().positive('TP2 must be positive').optional().nullable(),
  riskPercentPerTrade: z
    .number()
    .min(0.01, 'Risk % must be at least 0.01')
    .max(100, 'Risk % cannot exceed 100')
    .optional()
    .nullable(),
  maxTradesPerDay: z
    .number()
    .int('Max trades must be a whole number')
    .positive('Max trades must be positive')
    .optional()
    .nullable(),
  tickSize: z.number().positive('Tick size must be positive').optional().nullable(),
  tickValue: z.number().positive('Tick value must be positive').optional().nullable(),
  pipValue: z.number().positive('Pip value must be positive').optional().nullable(),
  bestSessions: z.array(z.string()).optional().nullable(),
  entryNotes: z.string().max(1000, 'Notes must be less than 1000 characters').optional().nullable(),
  sortOrder: z.number().int().default(0),
});

export const updateStrategySchema = createStrategySchema.partial();

// Extend trading account update to include calculator settings
export const calculatorSettingsSchema = z.object({
  accountBalance: z.number().positive('Balance must be positive').optional().nullable(),
  calculatorLeverage: z
    .number()
    .int()
    .positive('Leverage must be positive')
    .optional()
    .nullable(),
});

export type CreateStrategyInput = z.infer<typeof createStrategySchema>;
export type UpdateStrategyInput = z.infer<typeof updateStrategySchema>;
export type CalculatorSettingsInput = z.infer<typeof calculatorSettingsSchema>;

// ============================================
// TRADING DAY CHECKLIST VALIDATION SCHEMAS
// ============================================

export const itemStateSchema = z.object({
  checked: z.boolean(),
  remark: z.string().max(300, 'Remark must be less than 300 characters').optional(),
});

export const updateChecklistSchema = z.object({
  itemStates: z.record(z.string(), itemStateSchema),
});

export type ItemState = z.infer<typeof itemStateSchema>;
export type ItemStates = Record<string, ItemState>;
export type UpdateChecklistInput = z.infer<typeof updateChecklistSchema>;