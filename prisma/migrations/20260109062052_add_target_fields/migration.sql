/*
  Warnings:

  - Added the required column `end_date` to the `user_targets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_date` to the `user_targets` table without a default value. This is not possible if the table is not empty.
  - Made the column `target_sop_rate` on table `user_targets` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_user_targets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "target_win_rate" REAL NOT NULL,
    "target_sop_rate" REAL NOT NULL,
    "target_profit_usd" REAL,
    "start_date" DATETIME NOT NULL,
    "end_date" DATETIME NOT NULL,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "user_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_targets" ("active", "created_at", "id", "target_sop_rate", "target_type", "target_win_rate", "updated_at", "user_id") SELECT "active", "created_at", "id", "target_sop_rate", "target_type", "target_win_rate", "updated_at", "user_id" FROM "user_targets";
DROP TABLE "user_targets";
ALTER TABLE "new_user_targets" RENAME TO "user_targets";
CREATE INDEX "user_targets_user_id_idx" ON "user_targets"("user_id");
CREATE INDEX "user_targets_user_id_target_type_active_idx" ON "user_targets"("user_id", "target_type", "active");
CREATE INDEX "user_targets_user_id_active_start_date_end_date_idx" ON "user_targets"("user_id", "active", "start_date", "end_date");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
