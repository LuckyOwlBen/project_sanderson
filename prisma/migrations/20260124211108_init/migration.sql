-- CreateTable
CREATE TABLE "Character" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "level" INTEGER NOT NULL DEFAULT 1,
    "pendingLevelPoints" INTEGER NOT NULL DEFAULT 0,
    "ancestry" TEXT,
    "sessionNotes" TEXT NOT NULL DEFAULT '',
    "lastModified" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CultureSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "expertise" TEXT NOT NULL,
    "suggestedNames" TEXT NOT NULL,
    CONSTRAINT "CultureSelection_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PathSelection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "pathName" TEXT NOT NULL,
    CONSTRAINT "PathSelection_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Attributes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "strength" INTEGER NOT NULL DEFAULT 2,
    "speed" INTEGER NOT NULL DEFAULT 2,
    "intellect" INTEGER NOT NULL DEFAULT 2,
    "willpower" INTEGER NOT NULL DEFAULT 2,
    "awareness" INTEGER NOT NULL DEFAULT 2,
    "presence" INTEGER NOT NULL DEFAULT 2,
    CONSTRAINT "Attributes_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "skillName" TEXT NOT NULL,
    "value" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Skill_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnlockedTalent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "talentId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "level" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "UnlockedTalent_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SelectedExpertise" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    CONSTRAINT "SelectedExpertise_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "equipped" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "InventoryItem_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CharacterResources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "healthCurrent" INTEGER NOT NULL DEFAULT 0,
    "healthMax" INTEGER NOT NULL DEFAULT 0,
    "focusCurrent" INTEGER NOT NULL DEFAULT 0,
    "focusMax" INTEGER NOT NULL DEFAULT 0,
    "investitureCurrent" INTEGER NOT NULL DEFAULT 0,
    "investitureMax" INTEGER NOT NULL DEFAULT 0,
    "investitureActive" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "CharacterResources_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RadiantPath" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "boundOrder" TEXT,
    "currentIdeal" INTEGER NOT NULL DEFAULT 1,
    "idealSpoken" BOOLEAN NOT NULL DEFAULT false,
    "surgePair" TEXT,
    "sprenType" TEXT,
    CONSTRAINT "RadiantPath_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UnlockedSingerForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "unlockedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UnlockedSingerForm_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SpentPoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "characterId" TEXT NOT NULL,
    "attributes" TEXT NOT NULL DEFAULT '{}',
    "skills" TEXT NOT NULL DEFAULT '{}',
    "talents" TEXT NOT NULL DEFAULT '{}',
    CONSTRAINT "SpentPoints_characterId_fkey" FOREIGN KEY ("characterId") REFERENCES "Character" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Character_name_idx" ON "Character"("name");

-- CreateIndex
CREATE INDEX "Character_lastModified_idx" ON "Character"("lastModified");

-- CreateIndex
CREATE UNIQUE INDEX "CultureSelection_characterId_name_key" ON "CultureSelection"("characterId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "PathSelection_characterId_pathName_key" ON "PathSelection"("characterId", "pathName");

-- CreateIndex
CREATE UNIQUE INDEX "Attributes_characterId_key" ON "Attributes"("characterId");

-- CreateIndex
CREATE INDEX "Skill_characterId_idx" ON "Skill"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_characterId_skillName_key" ON "Skill"("characterId", "skillName");

-- CreateIndex
CREATE INDEX "UnlockedTalent_characterId_idx" ON "UnlockedTalent"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "UnlockedTalent_characterId_talentId_key" ON "UnlockedTalent"("characterId", "talentId");

-- CreateIndex
CREATE INDEX "SelectedExpertise_characterId_idx" ON "SelectedExpertise"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "SelectedExpertise_characterId_name_key" ON "SelectedExpertise"("characterId", "name");

-- CreateIndex
CREATE INDEX "InventoryItem_characterId_idx" ON "InventoryItem"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_characterId_itemId_key" ON "InventoryItem"("characterId", "itemId");

-- CreateIndex
CREATE UNIQUE INDEX "CharacterResources_characterId_key" ON "CharacterResources"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "RadiantPath_characterId_key" ON "RadiantPath"("characterId");

-- CreateIndex
CREATE INDEX "UnlockedSingerForm_characterId_idx" ON "UnlockedSingerForm"("characterId");

-- CreateIndex
CREATE UNIQUE INDEX "UnlockedSingerForm_characterId_formId_key" ON "UnlockedSingerForm"("characterId", "formId");

-- CreateIndex
CREATE UNIQUE INDEX "SpentPoints_characterId_key" ON "SpentPoints"("characterId");
