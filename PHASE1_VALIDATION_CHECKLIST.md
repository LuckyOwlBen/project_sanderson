# Phase 1 Migration Validation Checklist

## Overview
This checklist covers the first 5 talents migrated to structured JSON format. These talents grant expertises and traits, replacing text-based parsing with structured data.

## Testing Instructions
For each talent below, create a character and validate that:
1. The expertise grants work correctly during levelup
2. Trait modifications apply to the correct items
3. The talent description still displays properly
4. No errors in the console

---

## Migrated Talents

### 1. **Killing Edge** (Hunter > Assassin)
**File**: [assassin.ts](src/app/character/talents/talentTrees/hunter/assassin.ts#L7-L20)

**Requirements**:
- Perception 2
- Seek Quarry talent

**Book Check Against**:
- Page: __95_ (please fill in)
- Section: Hunter Path > Assassin

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Expertise Grants | Gains **Knives** and **Slings** weapon expertises (fixed, no choice) | ☐x | |
| Trait Modification | When wielding a knife or sling, it gains **Deadly** and **Quickdraw** expert traits | ☐ | |
| Expert Trait Display | Traits only show when character has Knives/Slings expertise | ☐x | |
| Specific Items | Test with: Knife, Sling | ☐x | |
| Non-Applicable Items | Dagger should NOT get traits (different ID) | ☐x | |

**Structured Data Added**:
```typescript
expertiseGrants: [
  { type: 'fixed', expertises: ['Knives', 'Slings'] }
],
traitGrants: [
  { targetItems: ['knife', 'sling'], traits: ['Deadly', 'Quickdraw'], expert: true }
]
```

---

### 2. **Combat Training** (Hunter > Archer)
**File**: [archer.ts](src/app/character/talents/talentTrees/hunter/archer.ts#L7-L21)

**Requirements**:
- Seek Quarry talent

**Book Check Against**:
- Page: ___ (please fill in)
- Section: Hunter Path > Archer

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Weapon Expertise Choice | Presents choice from weapon category (Light/Heavy/Special) | ☐x | |
| Armor Expertise Choice | Presents choice from armor category (Armor Proficiency) | ☐x | |
| Fixed Expertise | Automatically gains **Military Life** cultural expertise | ☐x | |
| Multiple Choices | UI allows selecting one weapon AND one armor expertise | ☐x | |
| Graze Mechanic | Once per round, can graze on miss without spending focus | ☐x | This is NOT in structured data yet, just validate it still works |

**Structured Data Added**:
```typescript
expertiseGrants: [
  { type: 'category', choiceCount: 1, category: 'weapon' },
  { type: 'category', choiceCount: 1, category: 'armor' },
  { type: 'fixed', expertises: ['Military Life'] }
]
```

---

### 3. **Combat Training** (Warrior > Soldier)
**File**: [soldier.ts](src/app/character/talents/talentTrees/warrior/soldier.ts#L21-L37)

**Requirements**:
- Vigilant Stance talent

**Book Check Against**:
- Page: ___ (please fill in)
- Section: Warrior Path > Soldier

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Same as Archer | This is identical to Archer's Combat Training | ☐x | |
| Weapon Expertise Choice | Presents choice from weapon category | ☐x | |
| Armor Expertise Choice | Presents choice from armor category | ☐x | |
| Fixed Expertise | Automatically gains **Military Life** | ☐x | |

**Structured Data Added**:
```typescript
expertiseGrants: [
  { type: 'category', choiceCount: 1, category: 'weapon' },
  { type: 'category', choiceCount: 1, category: 'armor' },
  { type: 'fixed', expertises: ['Military Life'] }
]
```

---

### 4. **Shard Training** (Warrior > Shardbearer)
**File**: [shardbearer.ts](src/app/character/talents/talentTrees/warrior/shardbearer.ts#L7-L23)

**Requirements**:
- Vigilant Stance talent

**Book Check Against**:
- Page: ___ (please fill in)
- Section: Warrior Path > Shardbearer

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Fixed Expertise | Automatically gains **Shardplate** specialist expertise | ☐ | |
| Specialist Choice | Presents choice of ONE from: Grandbows, Shardblades, or Warhammers | ☐ | |
| Shardblade Multi-target | Once per round: Strike with Shardblade can graze additional targets | ☐ | Not in structured data yet |
| Shardplate Charges | While wearing Shardplate, it has +2 charges | ☐ | Not in structured data yet |

**Structured Data Added**:
```typescript
expertiseGrants: [
  { type: 'fixed', expertises: ['Shardplate'] },
  { type: 'choice', choiceCount: 1, options: ['Grandbows', 'Shardblades', 'Warhammers'] }
]
```

---

### 5. **Lessons in Patience** (Envoy > Mentor)
**File**: [mentor.ts](src/app/character/talents/talentTrees/envoy/mentor.ts#L30-L44)

**Requirements**:
- Discipline 2
- Sound Advice talent

**Book Check Against**:
- Page: ___ (please fill in)
- Section: Envoy Path > Mentor

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Fixed Utility Expertise | Automatically gains **Motivational Speech** utility expertise | ☐ | |
| Rousing Presence Bonus | After using Rousing Presence, target recovers 1 focus | ☐ | Not in structured data yet |

**Structured Data Added**:
```typescript
expertiseGrants: [
  { type: 'fixed', expertises: ['Motivational Speech'] }
]
```

---

## Tier Information (For Reference)

Character tier is calculated from level:
- **Tier 1**: Levels 1-5
- **Tier 2**: Levels 6-10
- **Tier 3**: Levels 11-15
- **Tier 4**: Levels 16-20
- **Tier 5**: Level 21+

This will be needed when we add tier-scaled bonuses in future phases.

---

## Testing Workflow

1. **Create test characters** at appropriate levels for each talent:
   - Level 3 Assassin (for Killing Edge)
   - Level 3 Archer (for Combat Training)
   - Level 2 Soldier (for Combat Training)
   - Level 3 Shardbearer (for Shard Training)
   - Level 5 Mentor (for Lessons in Patience)

2. **Take the talent** through levelup UI

3. **Verify expertise grants**:
   - Check character sheet shows new expertises
   - For choices, ensure UI presents options correctly
   - For fixed, ensure it appears automatically

4. **Verify trait grants** (Killing Edge only):
   - Equip a knife
   - Check that Deadly and Quickdraw appear in expert traits section
   - Equip without expertise - expert traits should not show
   - Gain Knives expertise - expert traits should now show

5. **Check console** for any errors or warnings

6. **Compare with book** - fill in page numbers and verify descriptions match

---

## Known Issues / Future Work

The following are **NOT** in structured format yet (still in `otherEffects` or hardcoded):

- ❌ Graze on miss mechanic (Combat Training)
- ❌ Shardblade multi-target grazing (Shard Training)
- ❌ Shardplate charge bonus (Shard Training)
- ❌ Focus recovery trigger (Lessons in Patience)

These will be addressed in future phases when we add attack definitions and passive effect systems.

---

## Sign-Off

Once validated, provide feedback on:
1. Any discrepancies with the book
2. Expertise grant UX (easy to understand choices?)
3. Trait modification visibility (clear when traits are added?)
4. Any bugs or unexpected behavior
5. Which talent path to migrate next

Then we'll proceed with **Phase 2**: Combat attack talents (Fatal Thrust, Devastating Blow, etc.)
