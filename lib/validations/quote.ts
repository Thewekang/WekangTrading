import { z } from 'zod';

// ============================================
// QUOTE CATEGORY ENUM
// ============================================

export const quoteCategorySchema = z.enum([
  'discipline',
  'loss',
  'win',
  'confidence',
  'patience',
  'overtrading',
  'risk',
  'mental',
  'general',
]);

export const quoteSourceTypeSchema = z.enum(['original', 'publicFigure']);

// ============================================
// TRADING QUOTE SCHEMAS
// ============================================

export const tradingQuoteSchema = z.object({
  id: z.string().min(1),
  enabled: z.boolean(),
  category: quoteCategorySchema,
  weight: z.number().int().min(1).max(10),
  textEn: z.string().min(1).max(500),
  textBm: z.string().min(1).max(500),
  author: z.string().max(100).optional(),
  sourceType: quoteSourceTypeSchema.optional(),
  displayCount: z.number().int().min(0).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const createQuoteSchema = z.object({
  id: z.string().min(1).regex(/^q-\d+$/, 'ID must be in format: q-XXX'),
  enabled: z.boolean().default(true),
  category: quoteCategorySchema,
  weight: z.number().int().min(1).max(10).default(5),
  textEn: z.string().min(1).max(500),
  textBm: z.string().min(1).max(500),
  author: z.string().max(100).optional(),
  sourceType: quoteSourceTypeSchema.optional(),
});

export const updateQuoteSchema = z.object({
  enabled: z.boolean().optional(),
  category: quoteCategorySchema.optional(),
  weight: z.number().int().min(1).max(10).optional(),
  textEn: z.string().min(1).max(500).optional(),
  textBm: z.string().min(1).max(500).optional(),
  author: z.string().max(100).optional(),
  sourceType: quoteSourceTypeSchema.optional(),
});

export const getRandomQuoteSchema = z.object({
  category: quoteCategorySchema.optional(),
  userId: z.string().uuid(),
  forceShow: z.boolean().default(false),
});

// ============================================
// USER QUOTE PREFERENCES SCHEMAS
// ============================================

export const updateQuotePreferencesSchema = z.object({
  showQuotes: z.boolean().optional(),
  quotesCooldownMinutes: z.number().int().min(0).max(120).optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type TradingQuote = z.infer<typeof tradingQuoteSchema>;
export type CreateQuote = z.infer<typeof createQuoteSchema>;
export type UpdateQuote = z.infer<typeof updateQuoteSchema>;
export type GetRandomQuoteInput = z.infer<typeof getRandomQuoteSchema>;
export type QuoteCategory = z.infer<typeof quoteCategorySchema>;
export type QuoteSourceType = z.infer<typeof quoteSourceTypeSchema>;
export type UpdateQuotePreferences = z.infer<typeof updateQuotePreferencesSchema>;
