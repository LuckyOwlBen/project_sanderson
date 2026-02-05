-- CreateTable
CREATE TABLE "PendingGrantQueue" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "grantType" TEXT NOT NULL,
    "grantData" TEXT NOT NULL,
    "socketId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "PendingGrantQueue_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "pendingLevelPoints" INTEGER NOT NULL DEFAULT 0,
    "pendingLevel" BOOLEAN NOT NULL DEFAULT false,
    "ancestry" TEXT,
    "sessionNotes" TEXT NOT NULL DEFAULT '',
    "currencyInChips" REAL NOT NULL DEFAULT 0,
    "lastModified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Character" ("ancestry", "currencyInChips", "id", "lastModified", "level", "name", "pendingLevelPoints", "sessionNotes") SELECT "ancestry", "currencyInChips", "id", "lastModified", "level", "name", "pendingLevelPoints", "sessionNotes" FROM "Character";
DROP TABLE "Character";
ALTER TABLE "new_Character" RENAME TO "Character";
CREATE INDEX "Character_name_idx" ON "Character"("name");
CREATE INDEX "Character_lastModified_idx" ON "Character"("lastModified");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "PendingGrantQueue_characterId_idx" ON "PendingGrantQueue"("characterId");

-- CreateIndex
CREATE INDEX "PendingGrantQueue_createdAt_idx" ON "PendingGrantQueue"("createdAt");
