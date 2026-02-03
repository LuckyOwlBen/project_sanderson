-- CreateTable
CREATE TABLE "ExpertiseState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "pointsSpent" INTEGER NOT NULL DEFAULT 0,
    "pointsRemaining" INTEGER NOT NULL DEFAULT 0,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ExpertiseState_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ExpertiseState_characterId_key" ON "ExpertiseState"("characterId");

-- CreateIndex
CREATE INDEX "ExpertiseState_characterId_idx" ON "ExpertiseState"("characterId");
