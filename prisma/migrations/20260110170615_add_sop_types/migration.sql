-- CreateTable
CREATE TABLE "sop_types" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_individual_trades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "daily_summary_id" TEXT,
    "sop_type_id" TEXT,
    "trade_timestamp" DATETIME NOT NULL,
    "result" TEXT NOT NULL,
    "sop_followed" BOOLEAN NOT NULL,
    "profit_loss_usd" REAL NOT NULL,
    "market_session" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "individual_trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "individual_trades_daily_summary_id_fkey" FOREIGN KEY ("daily_summary_id") REFERENCES "daily_summaries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "individual_trades_sop_type_id_fkey" FOREIGN KEY ("sop_type_id") REFERENCES "sop_types" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_individual_trades" ("created_at", "daily_summary_id", "id", "market_session", "notes", "profit_loss_usd", "result", "sop_followed", "trade_timestamp", "updated_at", "user_id") SELECT "created_at", "daily_summary_id", "id", "market_session", "notes", "profit_loss_usd", "result", "sop_followed", "trade_timestamp", "updated_at", "user_id" FROM "individual_trades";
DROP TABLE "individual_trades";
ALTER TABLE "new_individual_trades" RENAME TO "individual_trades";
CREATE INDEX "individual_trades_user_id_trade_timestamp_idx" ON "individual_trades"("user_id", "trade_timestamp");
CREATE INDEX "individual_trades_daily_summary_id_idx" ON "individual_trades"("daily_summary_id");
CREATE INDEX "individual_trades_sop_type_id_idx" ON "individual_trades"("sop_type_id");
CREATE INDEX "individual_trades_market_session_idx" ON "individual_trades"("market_session");
CREATE INDEX "individual_trades_result_idx" ON "individual_trades"("result");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "sop_types_name_key" ON "sop_types"("name");

-- CreateIndex
CREATE INDEX "sop_types_active_sort_order_idx" ON "sop_types"("active", "sort_order");
