-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_daily_summaries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "trade_date" DATETIME NOT NULL,
    "total_trades" INTEGER NOT NULL DEFAULT 0,
    "total_wins" INTEGER NOT NULL DEFAULT 0,
    "total_losses" INTEGER NOT NULL DEFAULT 0,
    "total_sop_followed" INTEGER NOT NULL DEFAULT 0,
    "total_sop_not_followed" INTEGER NOT NULL DEFAULT 0,
    "total_profit_loss_usd" REAL NOT NULL DEFAULT 0,
    "asia_session_trades" INTEGER NOT NULL DEFAULT 0,
    "europe_session_trades" INTEGER NOT NULL DEFAULT 0,
    "us_session_trades" INTEGER NOT NULL DEFAULT 0,
    "overlap_session_trades" INTEGER NOT NULL DEFAULT 0,
    "best_session" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "daily_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_daily_summaries" ("asia_session_trades", "best_session", "created_at", "europe_session_trades", "id", "notes", "total_losses", "total_profit_loss_usd", "total_sop_followed", "total_sop_not_followed", "total_trades", "total_wins", "trade_date", "updated_at", "us_session_trades", "user_id") SELECT "asia_session_trades", "best_session", "created_at", "europe_session_trades", "id", "notes", "total_losses", "total_profit_loss_usd", "total_sop_followed", "total_sop_not_followed", "total_trades", "total_wins", "trade_date", "updated_at", "us_session_trades", "user_id" FROM "daily_summaries";
DROP TABLE "daily_summaries";
ALTER TABLE "new_daily_summaries" RENAME TO "daily_summaries";
CREATE INDEX "daily_summaries_user_id_trade_date_idx" ON "daily_summaries"("user_id", "trade_date");
CREATE INDEX "daily_summaries_trade_date_idx" ON "daily_summaries"("trade_date");
CREATE UNIQUE INDEX "daily_summaries_user_id_trade_date_key" ON "daily_summaries"("user_id", "trade_date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
