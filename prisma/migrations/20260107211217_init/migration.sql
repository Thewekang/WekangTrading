-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'USER',
    "email_verified" DATETIME,
    "image" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "individual_trades" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "daily_summary_id" TEXT,
    "trade_timestamp" DATETIME NOT NULL,
    "result" TEXT NOT NULL,
    "sop_followed" BOOLEAN NOT NULL,
    "profit_loss_usd" REAL NOT NULL,
    "market_session" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "individual_trades_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "individual_trades_daily_summary_id_fkey" FOREIGN KEY ("daily_summary_id") REFERENCES "daily_summaries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "daily_summaries" (
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
    "best_session" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "daily_summaries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_win_rate" REAL NOT NULL,
    "target_sop_rate" REAL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "individual_trades_user_id_trade_timestamp_idx" ON "individual_trades"("user_id", "trade_timestamp");

-- CreateIndex
CREATE INDEX "individual_trades_daily_summary_id_idx" ON "individual_trades"("daily_summary_id");

-- CreateIndex
CREATE INDEX "individual_trades_market_session_idx" ON "individual_trades"("market_session");

-- CreateIndex
CREATE INDEX "individual_trades_result_idx" ON "individual_trades"("result");

-- CreateIndex
CREATE INDEX "daily_summaries_user_id_trade_date_idx" ON "daily_summaries"("user_id", "trade_date");

-- CreateIndex
CREATE INDEX "daily_summaries_trade_date_idx" ON "daily_summaries"("trade_date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_summaries_user_id_trade_date_key" ON "daily_summaries"("user_id", "trade_date");

-- CreateIndex
CREATE INDEX "user_targets_user_id_target_type_active_idx" ON "user_targets"("user_id", "target_type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "user_targets_user_id_target_type_active_key" ON "user_targets"("user_id", "target_type", "active");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "sessions"("session_token");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");
