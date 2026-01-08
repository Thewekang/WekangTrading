import { z } from 'zod';

// ============================================
// USER VALIDATION SCHEMAS
// ============================================

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
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

export const individualTradeSchema = z.object({
  tradeTimestamp: z.coerce.date().refine((date) => date <= new Date(), {
    message: 'Trade timestamp cannot be in the future',
  }),
  result: z.enum(['WIN', 'LOSS'], {
    required_error: 'Trade result is required',
  }),
  sopFollowed: z.boolean({
    required_error: 'SOP compliance is required',
  }),
  profitLossUsd: z.number({
    required_error: 'Profit/loss is required',
  }).refine((val) => val !== 0, {
    message: 'Profit/loss cannot be zero',
  }),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export const bulkTradeEntrySchema = z.object({
  tradeDate: z.coerce.date().refine((date) => date <= new Date(), {
    message: 'Trade date cannot be in the future',
  }),
  trades: z.array(individualTradeSchema).min(1, 'At least one trade is required').max(100, 'Maximum 100 trades per bulk entry'),
}).refine((data) => {
  // All trades must be on the same date as tradeDate
  const dateStr = data.tradeDate.toISOString().split('T')[0];
  return data.trades.every((trade) => {
    const tradeDate = new Date(trade.tradeTimestamp).toISOString().split('T')[0];
    return tradeDate === dateStr;
  });
}, {
  message: 'All trades must be on the same date',
  path: ['trades'],
});

// ============================================
// USER TARGET VALIDATION SCHEMAS
// ============================================

export const userTargetSchema = z.object({
  targetType: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY'], {
    required_error: 'Target type is required',
  }),
  targetWinRate: z.number().min(0, 'Win rate must be at least 0%').max(100, 'Win rate cannot exceed 100%'),
  targetSopRate: z.number().min(0, 'SOP rate must be at least 0%').max(100, 'SOP rate cannot exceed 100%').optional(),
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
