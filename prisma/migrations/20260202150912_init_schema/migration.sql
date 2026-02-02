-- CreateTable
CREATE TABLE "SkillsState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "pointsSpent" INTEGER NOT NULL DEFAULT 0,
    "pointsRemaining" INTEGER NOT NULL DEFAULT 0,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "SkillsState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Attributes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "pointsSpent" INTEGER NOT NULL DEFAULT 0,
    "pointsRemaining" INTEGER NOT NULL DEFAULT 0,
    "strength" INTEGER NOT NULL DEFAULT 2,
    "speed" INTEGER NOT NULL DEFAULT 2,
    "intellect" INTEGER NOT NULL DEFAULT 2,
    "willpower" INTEGER NOT NULL DEFAULT 2,
    "awareness" INTEGER NOT NULL DEFAULT 2,
    "presence" INTEGER NOT NULL DEFAULT 2,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Attributes_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Attributes" ("awareness", "characterId", "id", "intellect", "presence", "speed", "strength", "willpower") SELECT "awareness", "characterId", "id", "intellect", "presence", "speed", "strength", "willpower" FROM "Attributes";
DROP TABLE "Attributes";
ALTER TABLE "new_Attributes" RENAME TO "Attributes";
CREATE UNIQUE INDEX "Attributes_characterId_key" ON "Attributes"("characterId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "SkillsState_characterId_key" ON "SkillsState"("characterId");

-- CreateIndex
CREATE INDEX "SkillsState_characterId_idx" ON "SkillsState"("characterId");
