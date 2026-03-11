-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PathSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "pathName" TEXT NOT NULL,
    "tier0TalentId" TEXT,
    "finalized" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "PathSelection_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PathSelection" ("characterId", "id", "pathName", "tier0TalentId") SELECT "characterId", "id", "pathName", "tier0TalentId" FROM "PathSelection";
DROP TABLE "PathSelection";
ALTER TABLE "new_PathSelection" RENAME TO "PathSelection";
CREATE UNIQUE INDEX "PathSelection_characterId_pathName_key" ON "PathSelection"("characterId", "pathName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
