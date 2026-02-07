-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CharacterTalents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "pointsSpent" INTEGER NOT NULL DEFAULT 0,
    "pointsRemaining" INTEGER NOT NULL DEFAULT 0,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "totalTalents" TEXT NOT NULL DEFAULT '[]',
    "pendingTalents" TEXT NOT NULL DEFAULT '[]',
    "pendingTrees" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "CharacterTalents_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CharacterTalents" ("characterId", "finalized", "id", "pendingTalents", "pointsRemaining", "pointsSpent", "totalPoints", "totalTalents") SELECT "characterId", "finalized", "id", "pendingTalents", "pointsRemaining", "pointsSpent", "totalPoints", "totalTalents" FROM "CharacterTalents";
DROP TABLE "CharacterTalents";
ALTER TABLE "new_CharacterTalents" RENAME TO "CharacterTalents";
CREATE UNIQUE INDEX "CharacterTalents_characterId_key" ON "CharacterTalents"("characterId");
CREATE INDEX "CharacterTalents_characterId_idx" ON "CharacterTalents"("characterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
