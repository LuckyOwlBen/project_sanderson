# Attacks System Implementation

## Overview
The attacks system connects equipment (weapons), talents, and character skills to generate available combat actions. This provides a unified view of all attack options during combat, displayed at the top of the Talents & Expertises tab for quick reference.

## Architecture

### Core Components

#### 1. Attack Data Model (`attackInterfaces.ts`)
- **Attack**: Main interface representing a combat action
  - Source tracking (weapon, talent, or combined)
  - Attack bonus calculation (skill + attribute)
  - Damage dice and type
  - Defense target (Physical/Cognitive/Spiritual)
  - Action and resource costs
  - Traits and modifiers
  - **Extensible**: Includes `customModifiers` array for future combat features

- **Stance**: Combat stance interface
  - Tracks stance talents (Flamestance, Stonestance, etc.)
  - Activation costs and effects
  - Bonuses while active

- **AttackModifier**: Extensible modifier system
  - Supports damage, attack bonus, trait, and other modifications
  - Conditional modifiers
  - Ready for future combat chapter additions

#### 2. Attack Calculator (`attackCalculator.ts`)
Generates attacks from character state:

**Weapon Attacks**:
- Reads equipped weapons from inventory
- Calculates attack bonus from skill + attribute
- Applies Mighty talent damage bonus if unlocked
- Includes expert traits if character has required expertise
- Targets Physical defense by default

**Talent Attacks**:
- Parses combat talents (e.g., Fatal Thrust, Devastating Blow)
- Extracts attack details from descriptions
- Handles tier-based damage scaling
- Determines defense type and range
- Includes focus costs

**Stance Detection**:
- Finds all talents with "stance" in the name
- Generates stance entries with effects
- 1 action activation cost

#### 3. Character Integration
Added to `Character` class:
```typescript
getAvailableAttacks(): Attack[]
getAvailableStances(): Stance[]
```

#### 4. UI Component (`character-attacks`)
Display component with:
- Grouped attacks (Melee/Ranged/Special)
- Expandable details panels
- Color-coded defense types and damage types
- Trait badges
- Resource costs
- Empty states

### Data Flow

```
Character State
    ↓
    ├─→ Equipped Weapons → Weapon Attacks
    ├─→ Unlocked Talents → Talent Attacks  
    └─→ Stance Talents → Available Stances
         ↓
    AttackCalculator
         ↓
    Attack[] + Stance[]
         ↓
    CharacterAttacksComponent
         ↓
    Displayed on Talents & Expertises Tab
```

## Extensibility

### Adding New Combat Features

#### 1. Custom Modifiers
Use the `customModifiers` array on Attack:
```typescript
attack.customModifiers = [
  {
    source: 'advantage',
    type: 'attackBonus',
    value: 2,
    description: 'Advantage on attack',
    condition: 'flanking'
  }
];
```

#### 2. New Attack Sources
Extend `AttackSource` type:
```typescript
export type AttackSource = 'weapon' | 'talent' | 'combined' | 'item' | 'condition';
```

Add generation logic in AttackCalculator:
```typescript
private getItemAttacks(): Attack[] {
  // Generate attacks from special items
}
```

#### 3. Damage Type Expansion
Add to `DamageType`:
```typescript
export type DamageType = 'keen' | 'impact' | 'energy' | 'vital' | 'spirit' | 'psychic' | 'radiant';
```

Update styling in `character-attacks.scss`:
```scss
.damage-psychic {
  background: #00bcd4;
  color: white;
}
```

#### 4. Complex Attack Parsing
For talents with complex mechanics:
```typescript
private parseTalentAttack(talent: TalentNode) {
  // Add custom parsing for specific talent IDs
  if (talent.id === 'special_technique') {
    return this.parseSpecialTechnique(talent);
  }
  // ... existing parsing
}
```

#### 5. Stance State Tracking
To track active stance (future enhancement):
```typescript
// Add to Character class
activeStance?: string;

setActiveStance(stanceId: string) {
  // Clear previous stance bonuses
  // Apply new stance bonuses
  this.activeStance = stanceId;
}
```

### Item Property Requirements

Weapons must have `weaponProperties`:
```typescript
{
  skill: 'light-weaponry' | 'heavy-weaponry' | 'athletics',
  damage: string,  // e.g., '1d6', '2d10'
  damageType: DamageType,
  range: string,   // e.g., 'Melee', 'Ranged[80/320]'
  traits: string[],
  expertTraits: string[]
}
```

### Talent Refactorability

Combat talents should follow conventions:
- Include "attack" or "strike" in description for auto-detection
- Specify defense type: "Physical defense", "Cognitive defense", "Spiritual defense"
- Indicate weapon type: "light weapon", "melee weapon", "ranged weapon"
- Include damage: "add X damage" or "roll XdY damage"
- Tier scaling in description or `otherEffects`

Example:
```typescript
{
  id: "powerful_strike",
  name: "Powerful Strike",
  description: "Make a melee weapon attack against the Physical defense of a target. Add 2d8 damage (3d8 at tier 3, 4d8 at tier 4).",
  actionCost: 2,
  otherEffects: ["Melee attack vs Physical", "Extra damage: 2d8 (scales with tier)"]
}
```

## Future Enhancements

### Short Term
1. **Attack Roller**: Integrate with skill-roller for d20 + bonus
2. **Damage Roller**: Add dice roller for damage calculation
3. **Active Stance Tracking**: UI to activate/deactivate stances
4. **Advantage/Disadvantage**: Visual indicators and modifiers

### Medium Term
1. **Combined Attacks**: Explicit combinations (e.g., "Rapier + Feinting Strike")
2. **Situational Modifiers**: Flanking, cover, prone, etc.
3. **Attack History**: Track recent attacks in combat log
4. **Quick Actions**: One-click attack buttons with auto-rolls

### Long Term
1. **GM Dashboard Integration**: Send attack rolls to GM
2. **Target Selection**: Choose targets from encounter
3. **Damage Application**: Auto-calculate damage after successful hit
4. **Combat Automation**: Full turn-based combat system

## Testing Recommendations

Test with characters having:
1. **No weapons equipped** → Empty state message
2. **Single weapon** → One weapon attack displayed
3. **Dual wielding** → Multiple weapon attacks
4. **Combat talents unlocked** → Talent attacks appear
5. **Mighty talent** → Damage bonus applied to weapon attacks
6. **Stance talents** → Stances section appears
7. **Multiple tiers** → Damage scaling works correctly

## Files Created/Modified

### New Files
- `src/app/character/attacks/attackInterfaces.ts` - Type definitions
- `src/app/character/attacks/attackCalculator.ts` - Attack generation logic
- `src/app/components/shared/character-attacks/character-attacks.ts` - Display component
- `src/app/components/shared/character-attacks/character-attacks.html` - Template
- `src/app/components/shared/character-attacks/character-attacks.scss` - Styling

### Modified Files
- `src/app/character/character.ts` - Added getAvailableAttacks() and getAvailableStances()
- `src/app/components/shared/character-powers-tab/character-powers-tab.ts` - Imported attacks component
- `src/app/components/shared/character-powers-tab/character-powers-tab.html` - Integrated attacks display

## Summary

The attacks system provides a clean, extensible foundation for combat features. It:
- ✅ Connects equipment, talents, and armor
- ✅ Displays at top of Talents & Expertises tab
- ✅ Shows only equipped weapons and active talents
- ✅ Includes stance tracking
- ✅ Designed for easy extension as combat chapter features are added
- ✅ Refactorable talent and item systems
