-- CreateTable
CREATE TABLE "CharacterTalents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "pointsSpent" INTEGER NOT NULL DEFAULT 0,
    "pointsRemaining" INTEGER NOT NULL DEFAULT 0,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    "totalTalents" TEXT NOT NULL DEFAULT '[]',
    "pendingTalents" TEXT NOT NULL DEFAULT '[]',
    CONSTRAINT "CharacterTalents_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "CharacterTalents_characterId_key" ON "CharacterTalents"("characterId");

-- CreateIndex
CREATE INDEX "CharacterTalents_characterId_idx" ON "CharacterTalents"("characterId");
