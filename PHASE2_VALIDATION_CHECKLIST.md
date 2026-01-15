# Phase 2 Migration Validation Checklist

## Overview
This checklist covers 8 combat attack talents migrated to structured `attackDefinition` format. These talents generate attacks that appear in the attacks section, replacing hardcoded text parsing with structured tier-scaled data.

## Testing Instructions
For each talent below:
1. Create a character at the appropriate level with required skills
2. Take the talent
3. Verify the attack appears in the attacks section
4. Check that damage scales correctly with tier
5. Verify resource costs display correctly
6. Compare description and mechanics with the book

---

## Migrated Talents

### 1. **Fatal Thrust** (Hunter > Assassin)
**File**: [assassin.ts](src/app/character/talents/talentTrees/hunter/assassin.ts#L67-L91)

**Requirements**:
- Perception 3
- Startling Blow talent
- Tier 2 (Level 6+)

**Book Reference**: Page ___ (Hunter > Assassin)

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Attack Appears | "Fatal Thrust" attack shows in attacks list | ☐ | |
| Action Cost | 2 actions | ☐ | |
| Target Defense | Cognitive defense | ☐ | |
| Range | Melee | ☐ | |
| Weapon Requirement | Must use light weapon | ☐ | Check description |
| Base Damage (T1-T2) | +4d4 extra damage | ☐ | Levels 1-10 |
| Scaled Damage (T3) | +6d4 extra damage | ☐ | Levels 11-15 |
| Scaled Damage (T4) | +8d4 extra damage | ☐ | Levels 16-20 |
| Scaled Damage (T5) | +10d4 extra damage | ☐ | Level 21+ |
| Conditional Advantage | +2 advantages if weapon has Discreet trait | ☐ | See special mechanics |
| Special Mechanics | Target conditions listed in traits | ☐ | Surprised/unaware/not-threat |

**Structured Data**:
```typescript
attackDefinition: {
  weaponType: 'light',
  targetDefense: 'Cognitive',
  range: 'melee',
  baseDamage: '4d4',
  damageScaling: [
    { tier: 3, damage: '6d4' },
    { tier: 4, damage: '8d4' },
    { tier: 5, damage: '10d4' }
  ],
  conditionalAdvantages: [
    { condition: 'weapon has Discreet trait', value: 2 }
  ]
}
```

---

### 2. **Startling Blow** (Hunter > Assassin)
**File**: [assassin.ts](src/app/character/talents/talentTrees/hunter/assassin.ts#L27-L47)

**Requirements**:
- Stealth 1
- Seek Quarry talent
- Tier 1

**Book Reference**: Page ___ (Hunter > Assassin)

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Attack Appears | "Startling Blow" in attacks list | ☐ | |
| Action Cost | 1 action | ☐ | |
| Target Defense | Cognitive defense | ☐ | |
| Range | Melee | ☐ | |
| Weapon Type | Unarmed or improvised | ☐ | Uses Athletics skill |
| Special Effect | On hit/graze: target Surprised | ☐ | Check traits |
| Size Restriction | Only vs same size or smaller | ☐ | Check traits |

**Structured Data**:
```typescript
attackDefinition: {
  weaponType: 'unarmed',
  targetDefense: 'Cognitive',
  range: 'melee',
  specialMechanics: [
    "Can use unarmed or improvised weapon",
    "On hit or graze: target becomes Surprised until end of your next turn",
    "Only works on targets of same size or smaller"
  ]
}
```

---

### 3. **Tagging Shot** (Hunter > Archer)
**File**: [archer.ts](src/app/character/talents/talentTrees/hunter/archer.ts#L41-L59)

**Requirements**:
- Perception 2
- Seek Quarry talent
- Tier 1

**Book Reference**: Page ___ (Hunter > Archer)

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Attack Appears | "Tagging Shot" in attacks list | ☐ | |
| Action Cost | 3 actions | ☐ | |
| Target Defense | Physical defense | ☐ | |
| Range | Ranged | ☐ | |
| Movement | Move 5 feet before attacking | ☐ | Check special mechanics |
| Quarry Effect | On hit/graze: mark as quarry | ☐ | Check traits |

**Structured Data**:
```typescript
attackDefinition: {
  weaponType: 'any',
  targetDefense: 'Physical',
  range: 'ranged',
  specialMechanics: [
    "Move up to 5 feet before attacking",
    "On hit or graze: target becomes your quarry"
  ]
}
```

---

### 4. **Devastating Blow** (Warrior > Soldier)
**File**: [soldier.ts](src/app/character/talents/talentTrees/warrior/soldier.ts#L54-L73)

**Requirements**:
- Athletics 3
- Combat Training talent
- Tier 2 (Level 6+)

**Book Reference**: Page ___ (Warrior > Soldier)

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Attack Appears | "Devastating Blow" in attacks list | ☐ | |
| Action Cost | 2 actions | ☐ | |
| Target Defense | Physical defense | ☐ | |
| Range | Melee | ☐ | |
| Base Damage (T1-T2) | +2d8 extra damage | ☐ | Levels 1-10 |
| Scaled Damage (T3) | +3d8 extra damage | ☐ | Levels 11-15 |
| Scaled Damage (T4) | +4d8 extra damage | ☐ | Levels 16-20 |
| Scaled Damage (T5) | +5d8 extra damage | ☐ | Level 21+ |

**Structured Data**:
```typescript
attackDefinition: {
  weaponType: 'any',
  targetDefense: 'Physical',
  range: 'melee',
  baseDamage: '2d8',
  damageScaling: [
    { tier: 3, damage: '3d8' },
    { tier: 4, damage: '4d8' },
    { tier: 5, damage: '5d8' }
  ]
}
```

---

### 5. **Wit's End** (Warrior > Duelist)
**File**: [duelist.ts](src/app/character/talents/talentTrees/warrior/duelist.ts#L103-L135)

**Requirements**:
- Intimidation 3
- Feinting Strike talent
- Tier 4 (Level 16+)

**Book Reference**: Page ___ (Warrior > Duelist)

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Attack Appears | "Wit's End" in attacks list | ☐ | |
| Action Cost | 2 actions | ☐ | |
| Resource Cost | 1 focus | ☐ | Should display in UI |
| Target Defense | Cognitive defense | ☐ | |
| Range | Melee | ☐ | |
| Target Requirement | Target must have 0 focus | ☐ | Check special mechanics |
| Movement | Move half movement rate | ☐ | Check traits |
| Deflect Bypass | Ignores deflect value | ☐ | Check traits |
| No Graze | Cannot graze, only miss or hit | ☐ | Check traits |
| Base Damage (T1-T3) | +4d6 extra damage | ☐ | Levels 1-15 |
| Scaled Damage (T3) | +6d6 extra damage | ☐ | Levels 11-15 |
| Scaled Damage (T4) | +8d6 extra damage | ☐ | Levels 16-20 |
| Scaled Damage (T5) | +10d6 extra damage | ☐ | Level 21+ |

**Structured Data**:
```typescript
attackDefinition: {
  weaponType: 'any',
  targetDefense: 'Cognitive',
  range: 'melee',
  baseDamage: '4d6',
  damageScaling: [
    { tier: 3, damage: '6d6' },
    { tier: 4, damage: '8d6' },
    { tier: 5, damage: '10d6' }
  ],
  resourceCost: { type: 'focus', amount: 1 }
}
```

---

### 6. **Meteoric Leap** (Warrior > Shardbearer)
**File**: [shardbearer.ts](src/app/character/talents/talentTrees/warrior/shardbearer.ts#L96-L120)

**Requirements**:
- Athletics 3
- Bloodstance talent
- Tier 4 (Level 16+)

**Book Reference**: Page ___ (Warrior > Shardbearer)

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Attack Appears | "Meteoric Leap" in attacks list | ☐ | |
| Action Cost | 2 actions | ☐ | |
| Resource Cost | 2 focus | ☐ | Should display in UI |
| Target Defense | Physical defense | ☐ | |
| Range | Melee | ☐ | |
| Weapon Type | Unarmed | ☐ | Uses Athletics skill |
| Movement | Leap quarter movement rate | ☐ | Check special mechanics |
| Multi-Target | Attacks all chosen in reach | ☐ | Check traits |
| Shardplate Bonus | +1 advantage when wearing Shardplate | ☐ | See conditional advantages |
| Double Damage | Roll double damage dice | ☐ | Check traits |
| Prone Effect | Targets with lower STR knocked Prone | ☐ | Check traits |

**Structured Data**:
```typescript
attackDefinition: {
  weaponType: 'unarmed',
  targetDefense: 'Physical',
  range: 'melee',
  resourceCost: { type: 'focus', amount: 2 },
  conditionalAdvantages: [
    { condition: 'wearing Shardplate', value: 1 }
  ],
  specialMechanics: [
    "Leap up to quarter movement rate before attacking",
    "Attacks all chosen targets within reach",
    "Roll double damage dice",
    "On hit: targets with lower Strength knocked Prone"
  ]
}
```

---

### 7. **Swift Strikes** (Warrior > Soldier)
**File**: [soldier.ts](src/app/character/talents/talentTrees/warrior/soldier.ts#L101-L117)

**Requirements**:
- Hardy talent
- Tier 4 (Level 16+)

**Book Reference**: Page ___ (Warrior > Soldier)

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Attack Appears | "Swift Strikes" in attacks list | ☐ | |
| Action Cost | 1 action | ☐ | |
| Resource Cost | 1 focus | ☐ | Should display in UI |
| Special Mechanic | Strike again with same hand | ☐ | Check traits |
| Target Defense | Physical (standard Strike) | ☐ | |
| Range | Special (uses equipped weapon range) | ☐ | |

**Structured Data**:
```typescript
attackDefinition: {
  weaponType: 'any',
  targetDefense: 'Physical',
  range: 'special',
  resourceCost: { type: 'focus', amount: 1 },
  specialMechanics: [
    "Make a second Strike with a hand already used for Strike this turn"
  ]
}
```

---

### 8. **Valiant Intervention** (Leader > Champion)
**File**: [champion.ts](src/app/character/talents/talentTrees/leader/champion.ts#L21-L45)

**Requirements**:
- Athletics 1
- Decisive Command talent
- Tier 1

**Book Reference**: Page ___ (Leader > Champion)

**What to Validate**:

| Check | Expected Result | Status | Notes |
|-------|----------------|--------|-------|
| Attack Appears | "Valiant Intervention" in attacks list | ☐ | |
| Action Cost | 1 action | ☐ | |
| Resource Cost | 1 focus | ☐ | Should display in UI |
| Target Defense | Spiritual defense | ☐ | |
| Range | Special | ☐ | |
| Weapon Type | Unarmed/Athletics test | ☐ | Not a traditional attack |
| Movement | Move 10 feet before test | ☐ | Check special mechanics |
| Influence Requirement | Must be able to influence target | ☐ | Check traits |
| Success Effect | Target has disadvantage vs allies | ☐ | Check traits |
| Resist Effect | Gain advantage on next test | ☐ | Check traits |

**Structured Data**:
```typescript
attackDefinition: {
  weaponType: 'unarmed',
  targetDefense: 'Spiritual',
  range: 'special',
  resourceCost: { type: 'focus', amount: 1 },
  specialMechanics: [
    "Move up to 10 feet before attacking",
    "Uses Athletics test (not attack test)",
    "Must be able to influence target",
    "Success: target has disadvantage on tests vs allies until end of their next turn",
    "If target resists: gain advantage on next test vs them"
  ]
}
```

---

## Tier Calculation Reference

Tier is calculated from level:
- **Tier 1**: Levels 1-5
- **Tier 2**: Levels 6-10
- **Tier 3**: Levels 11-15
- **Tier 4**: Levels 16-20
- **Tier 5**: Level 21+

Formula: `Math.floor((level - 1) / 5) + 1`

---

## Testing Workflow

1. **Create test characters** at different tiers:
   - Level 3 character (Tier 1) - for Startling Blow, Tagging Shot, Valiant Intervention
   - Level 8 character (Tier 2) - for Fatal Thrust, Devastating Blow
   - Level 13 character (Tier 3) - to verify damage scaling
   - Level 18 character (Tier 4) - for Wit's End, Meteoric Leap, Swift Strikes
   - Level 22 character (Tier 5) - to verify maximum damage scaling

2. **Take the talents** through levelup UI

3. **Verify attack display**:
   - Check attacks section shows the talent attack
   - Verify action cost displays correctly
   - Verify resource cost (focus) displays correctly
   - Check target defense is correct
   - Verify range displays correctly

4. **Verify damage scaling**:
   - Level up character through tiers
   - Check that damage increases at tier thresholds
   - Verify tooltip or description shows scaling info

5. **Verify special mechanics**:
   - Check that traits/special mechanics appear
   - Verify conditional advantages are noted
   - Check that requirements are clearly stated

6. **Compare with book** - fill in page numbers and verify exact wording

---

## Known Limitations

The following are **NOT** fully implemented in structured format yet:

- ❌ Rolling mechanics (dice counting, injury roll modifiers) - stays in description
- ❌ Conditional effects (Surprised condition application) - in special mechanics text
- ❌ Movement integration - noted in special mechanics but not automated
- ❌ Multi-target selection - noted in special mechanics
- ❌ Advantage/disadvantage application - shown but not auto-applied
- ❌ Deflect bypass - noted but not calculated
- ❌ Graze prevention - noted but not enforced

These are complex game mechanics that will need UI and game state support beyond just the data structure.

---

## Sign-Off

After validation, provide feedback on:
1. Do attacks appear correctly in the attacks section?
2. Is damage scaling working at tier thresholds?
3. Are resource costs (focus) displaying clearly?
4. Are special mechanics understandable from the attack card?
5. Any discrepancies with the book?
6. Which passive combat modifiers to migrate next (Mighty, Steady Aim, etc.)?

Then we'll proceed with **Phase 3**: Passive Combat Modifiers using formula-based bonuses!

---

## For Next Agent Session

**Context**: This is Phase 2 of a multi-phase migration from text-based talent parsing to structured JSON format. The goal is to "quietly decommission the weird text parser" by incrementally migrating talents with user validation at each phase.

**What Was Completed**:
- ✅ Phase 1: 5 expertise/trait-granting talents (validated by user, one integration bugfix applied)
- ✅ Phase 2: 8 combat attack talents using `attackDefinition` structure
- ✅ Updated attackCalculator.ts to support structured definitions with tier scaling
- ✅ Added 6 new tests for attack generation (all 17 tests passing)
- ✅ Created PHASE1_VALIDATION_CHECKLIST.md and PHASE2_VALIDATION_CHECKLIST.md

**Current Status**: Awaiting user validation of Phase 2 before proceeding.

**What Comes Next (Phase 3)**:
- Migrate passive combat modifiers (Mighty, Steady Aim, Precision Shot, Shield Wielder, etc.)
- These require formula-based bonuses like "+1 + tier" or "+perception.ranks"
- Need to design expression system or enum types for formulas
- Likely affects attack calculator and bonus aggregation systems

**Key Files Modified**:
- [talentInterface.ts](src/app/character/talents/talentInterface.ts) - Added `expertiseGrants[]`, `traitGrants[]`, `attackDefinition{}`
- [traitDefinitions.ts](src/app/character/inventory/traitDefinitions.ts) - NEW - Parse/format weapon traits with parameters
- [talentEffectParser.ts](src/app/character/talents/talentEffectParser.ts) - Priority to structured data with fallback
- [attackCalculator.ts](src/app/character/attacks/attackCalculator.ts) - Generate attacks from `attackDefinition`
- 8 talent tree files (assassin, archer, soldier, duelist, shardbearer, champion)

**To Continue**:
1. Ask user if they've validated Phase 2 using this checklist
2. Address any issues found during validation
3. If validation passes, discuss Phase 3 approach:
   - Which passive modifiers to migrate first
   - How to represent formulas (string expressions vs typed enums vs calculated values)
   - Whether to extend `TalentNode` interface or create separate bonus system
4. Maintain incremental approach with validation at each phase
5. Keep tests green (currently 42+ passing tests across trait definitions, talent parser, attack calculator)

**Important Notes**:
- User prefers incremental validation ("come back and check my book")
- All code must respect dark mode theming
- No Angular Materials - custom components only
- Tier calculation: `Math.floor((level-1)/5)+1` (5 tiers: 1-5, 6-10, 11-15, 16-20, 21+)
- User already fixed one integration bug (trait grants not applying to attacks) after Phase 1
