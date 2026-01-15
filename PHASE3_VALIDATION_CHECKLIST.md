# Phase 3 Migration Validation Checklist

## Overview
Phase 3 migrates passive combat modifiers to use **formula-based bonuses** in the `BonusModule`. Formulas are evaluated at runtime with character context (tier, skill ranks, etc.) instead of hardcoded calculations.

## Implementation Summary

### What Changed

#### 1. **BonusModule** (`src/app/character/bonuses/bonusModule.ts`)
- Extended `BonusEffect` interface with `formula?: string` field
- Added `evaluateBonus(effect, context)` method to resolve formulas
- Added `evaluateFormula(formula, context)` private method that:
  - Replaces `tier` token with character tier
  - Replaces `skillName.ranks` with skill rank values
  - Safely evaluates math expressions
  - Returns integer result (floored)
- Updated `getBonusesFor()` to accept context and use formula evaluation

#### 2. **AttackCalculator** (`src/app/character/attacks/attackCalculator.ts`)
- Updated `getMightyDamageBonus()` to use formula evaluation instead of hardcoded `1 + tier`
- Added `buildSkillRanksMap()` helper to provide skill context for formula evaluation
- Now calls `this.character.bonuses.bonuses.evaluateBonus()` with context

#### 3. **5 Migrated Passive Talents**

| Talent | File | Bonus Type | Formula/Value | Notes |
|--------|------|-----------|----------|-------|
| **Mighty** | `hunter/assassin.ts` | SKILL | `1 + tier` | Damage bonus per action spent |
| **Steady Aim** | `hunter/archer.ts` | SKILL | `perception.ranks` | Ranged damage bonus (condition: on hit) |
| **Surefooted** | `warrior/duelist.ts` | DEFENSE | `2 * tier` | Terrain/falling damage reduction |
| **Cold Eyes** | `hunter/assassin.ts` | RESOURCE | `1` (fixed) | Focus recovery on quarry kill |
| **Hardy** | `hunter/archer.ts` | RESOURCE | `1` (fixed) | Health per level |

All 5 talents now have `bonuses[]` array populated with structured effects and preserve `otherEffects[]` for description fallback.

---

## Testing Instructions

### 1. **Build Verification**
```bash
npm run build
# Should complete successfully with only CSS budget warnings
```

### 2. **Manual Testing - Create Characters at Different Tiers**

**Test Scenario A: Tier 2 (Level 6-10) - Mighty (Assassin)**
1. Create a level 8 character (Tier 2)
2. Take Assassin path → Seek Quarry → Cold Eyes → Mighty
3. Equip a weapon
4. Check character sheet attacks → weapon attack damage
5. **Expected**: Damage shows `+3` bonus (1 + tier where tier = 2)
6. Level up to 9, 10 → damage stays +3 (still Tier 2)
7. Level up to 11 → damage shows `+4` (Tier 3)

**Test Scenario B: Steady Aim with Perception Bonus**
1. Create level 4 character with Perception 2
2. Take Hunter > Archer path → Combat Training → Steady Aim
3. Get Perception skill to rank 3 by levelup/training
4. Check ranged weapon attacks in character sheet
5. **Expected**: Ranged attacks show `+3` damage from Steady Aim formula
6. If Perception increases, damage should reflect new rank

**Test Scenario C: Surefooted Damage Reduction (Tier-Based)**
1. Create level 10 character (Tier 2)
2. Take Warrior > Duelist path → Ironstance → Surefooted
3. Check character details/bonuses section
4. **Expected**: Terrain/falling damage reduction shows `4` (2 * tier where tier = 2)
5. Level up to 16+ (Tier 4) → reduction shows `8` (2 * tier where tier = 4)

**Test Scenario D: Cold Eyes & Hardy (Fixed Value Bonuses)**
1. Create level 8 character
2. Take Assassin path → take Cold Eyes
3. Check bonus display in character sheet
4. **Expected**: Shows focus recovery bonus of 1 (fixed value, no formula)
5. For Hardy: Take Archer path → Hardy
6. **Expected**: Health bonus shows "1 per level" with total value

### 3. **Formula Evaluation Verification**

Create a test character with different skill ranks:
- Perception: 3
- Athletics: 2
- Agility: 1

Then verify:
- **Steady Aim** displays `+3` damage (perception.ranks = 3)
- **Mighty** displays tier-based damage (changes on level thresholds)

### 4. **Regression Testing**

Ensure Phase 1 & 2 still work:
- [ ] Phase 1 talents still grant expertise/traits correctly
- [ ] Phase 2 attack talents still appear in attacks section
- [ ] Damage scaling from Phase 2 still works at tier boundaries
- [ ] Phase 3 bonuses don't break non-migrated talents

---

## Formula Syntax Reference

The formula evaluator supports:
- `tier` → replaced with character tier
- `skillName.ranks` → replaced with skill rank value (e.g., `perception.ranks`)
- Math operators: `+ - * / ( )`
- Examples:
  - `1 + tier` → "1 + 2" → 3 (for Tier 2)
  - `perception.ranks` → "3" → 3 (if Perception rank = 3)
  - `2 * tier` → "2 * 3" → 6 (for Tier 3)
  - `athletics.ranks / 2` → "4 / 2" → 2 (if Athletics rank = 4)

---

## Known Issues / Limitations

### Formula System
- ✅ **Fixed**: Simple math expressions only
- ✅ **Safe**: Uses Function constructor with regex validation (no arbitrary code)
- ⚠️ **Limitation**: Formula context only includes common skills; custom attributes require extension

### Bonus Application
- ✅ **Works**: Passive bonus display in character sheet
- ⚠️ **Not Automated**: Bonus effects (terrain damage reduction, etc.) must be manually applied in gameplay/character recalc
- ⚠️ **Future**: Should integrate with attack damage calculation and attribute bonuses

### UI Display
- ⚠️ **Pending**: Character sheet bonus tab should show formula-based values
- ⚠️ **Pending**: Attack cards should show which bonuses apply to each attack

---

## Sign-Off Checklist

After manual testing, verify:

- [ ] All 5 talents display correctly in character sheet
- [ ] Formulas evaluate correctly for different character tiers
- [ ] Skill-based formulas use correct skill ranks
- [ ] Tier changes reflect in bonuses on levelup
- [ ] Phase 1 & 2 talents still work
- [ ] Build succeeds with no new errors
- [ ] No regression in existing character sheet displays

---

## Next Steps (Phase 4)

After Phase 3 validation:

1. **Passive Modifier Batch 2**: Migrate next 5-8 passive talents:
   - Shield Wielder (deflect calculation)
   - Precision Shot (accuracy bonus)
   - Specialty Modifiers (skill-specific bonuses)
   - Condition modifiers (advantage/disadvantage based on formulas)

2. **Enhanced Formula System**: If needed, add support for:
   - Attribute-based formulas (e.g., `strength / 2`)
   - Conditional bonuses (e.g., `1 + tier` only when X condition true)
   - Complex expressions with more operators

3. **Bonus UI Integration**:
   - Display evaluated bonus values in character sheet
   - Show which bonuses affect each attack
   - Allow toggling bonuses on/off for testing

4. **Automated Bonus Application**:
   - Integrate formulas into damage calculation
   - Apply conditional effects based on battle context
   - Real-time bonus adjustment on skill/attribute changes

---

## For Next Agent Session

**What Was Implemented:**
- ✅ Extended BonusEffect with formula field
- ✅ Created formula evaluator in BonusModule
- ✅ Updated attackCalculator to use formula evaluation
- ✅ Migrated 5 passive combat talents to structured bonuses
- ✅ Build passes, no compilation errors

**Current Status:** Ready for user validation testing

**What Comes Next:**
1. User tests the 5 migrated talents
2. Address any formula evaluation issues
3. Migrate next batch of passive modifiers
4. Extend formula system if needed for complex bonuses

**Key Files Modified:**
- `src/app/character/bonuses/bonusModule.ts` - Added formula support
- `src/app/character/attacks/attackCalculator.ts` - Uses formula evaluation
- `src/app/character/talents/talentTrees/hunter/assassin.ts` - Mighty, Cold Eyes
- `src/app/character/talents/talentTrees/hunter/archer.ts` - Steady Aim, Hardy
- `src/app/character/talents/talentTrees/warrior/duelist.ts` - Surefooted
