import { sqliteTable, text, integer, real, index } from 'drizzle-orm/sqlite-core';
import { tradingAccounts } from './tradingAccounts';
import { users } from './users';

// ============================================
// ACCOUNT STRATEGIES MODEL
// ============================================

/**
 * account_strategies — Per-symbol trading playbook entries.
 *
 * Each row represents a user's setup rules for one symbol on one account:
 *   - position sizing defaults (lot/contracts, SL, TP1, TP2)
 *   - risk parameters (riskPercentPerTrade)
 *   - instrument tick/pip values for position calculator
 *   - trading rules (max trades/day, preferred sessions)
 *   - free-text entry notes
 *
 * Instrument calculation approach:
 *   - FUTURES: use tickSize + tickValue (e.g. MNQ: 0.25 ticks / $0.50 per tick)
 *   - FOREX / COMMODITY / INDEX / CRYPTO: use pipValue (USD per pip per standard lot)
 *
 * The Position Calculator uses these values together with trading_accounts.accountBalance
 * and trading_accounts.calculatorLeverage to compute max lot size and projected P&L.
 */
export const accountStrategies = sqliteTable(
  'account_strategies',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),

    tradingAccountId: text('trading_account_id')
      .notNull()
      .references(() => tradingAccounts.id, { onDelete: 'cascade' }),

    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // ── Symbol ──────────────────────────────────────────────────────────────
    symbol: text('symbol').notNull(), // e.g. 'MNQ', 'EURUSD', 'XAUUSD'

    instrumentType: text('instrument_type', {
      enum: ['FOREX', 'COMMODITY', 'INDEX', 'CRYPTO', 'FUTURES'],
    })
      .notNull()
      .default('FUTURES'),

    // ── Position Defaults ───────────────────────────────────────────────────
    /** Default lot size / number of contracts */
    defaultLotSize: real('default_lot_size'),

    /** Stop loss distance in ticks (FUTURES) or pips (FOREX/CFD) */
    stopLossPoints: real('stop_loss_points'),

    /** Take-profit 1 distance in ticks or pips */
    tp1Points: real('tp1_points'),

    /** Take-profit 2 distance in ticks or pips (optional) */
    tp2Points: real('tp2_points'),

    // ── Risk Parameters ─────────────────────────────────────────────────────
    /** % of account balance to risk per trade (e.g. 1.0 = 1%) */
    riskPercentPerTrade: real('risk_percent_per_trade').default(1.0),

    /** Max trades allowed per day for this symbol (NULL = no limit) */
    maxTradesPerDay: integer('max_trades_per_day'),

    // ── Instrument Calculator Values ────────────────────────────────────────
    /**
     * FUTURES only — minimum price movement
     * e.g. MNQ: 0.25 | NQ: 0.25 | MGC: 0.10 | GC: 0.10 | MBT: 5 | BTC: 5
     */
    tickSize: real('tick_size'),

    /**
     * FUTURES only — USD value per tick per contract
     * e.g. MNQ: 0.50 | NQ: 5.00 | MGC: 1.00 | GC: 10.00 | MBT: 0.50 | BTC: 25.00
     */
    tickValue: real('tick_value'),

    /**
     * FOREX / COMMODITY / INDEX / CRYPTO — USD per pip per standard lot
     * e.g. EURUSD: 10 | XAUUSD: 1 (broker-dependent, user-overrideable)
     * NULL for FUTURES instruments (use tickSize / tickValue instead)
     */
    pipValue: real('pip_value'),

    // ── Trading Rules ───────────────────────────────────────────────────────
    /**
     * JSON array of preferred MarketSession values
     * e.g. '["US","EUROPE_US_OVERLAP"]'
     */
    bestSessions: text('best_sessions'), // JSON string

    /** Free-text setup notes / entry conditions */
    entryNotes: text('entry_notes'),

    // ── Meta ─────────────────────────────────────────────────────────────────
    isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),

    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    accountIdx: index('account_strategies_account_idx').on(table.tradingAccountId),
    userIdx: index('account_strategies_user_idx').on(table.userId),
    accountSymbolIdx: index('account_strategies_account_symbol_idx').on(
      table.tradingAccountId,
      table.symbol,
    ),
  }),
);

// ============================================
// TYPES
// ============================================
export type AccountStrategy = typeof accountStrategies.$inferSelect;
export type NewAccountStrategy = typeof accountStrategies.$inferInsert;
