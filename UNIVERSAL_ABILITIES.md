# Universal Abilities System

## Overview

The Universal Abilities system provides a flexible way to manage special one-off powers, actions, and rules that characters gain from various sources. This is separate from the talent tree system and is designed for simpler abilities that don't require complex prerequisites or progression.

## When to Use Universal Abilities vs Talents

**Use Universal Abilities for:**
- Simple actions or powers granted by character state (e.g., being a Radiant)
- Special rules that apply in specific situations
- Abilities from items or conditions
- One-off rules from the rulebook that don't fit into talent trees

**Use Talents for:**
- Complex abilities with prerequisites
- Powers that are part of a progression path
- Abilities that grant bonuses managed by the bonus system

## Architecture

### Core Files

1. **`src/app/character/abilities/universalAbilities.ts`**
   - Defines the `UniversalAbility` interface
   - Contains all ability definitions
   - Provides helper functions

2. **`src/app/character/radiantPath/radiantPathManager.ts`**
   - Integrates Radiant-specific abilities
   - Exposes `getUniversalAbilities()` method

3. **`src/app/character/character.ts`**
   - Aggregates abilities from all sources
   - Provides `getUniversalAbilities()` to the UI

4. **`src/app/components/shared/character-powers-tab/`**
   - Displays abilities in the Powers tab
   - Shows ability details, costs, and effects

## Adding New Abilities

### Step 1: Define the Ability

Open `src/app/character/abilities/universalAbilities.ts` and add your ability to the appropriate array:

```typescript
export const RADIANT_UNIVERSAL_ABILITIES: UniversalAbility[] = [
    // ... existing abilities
    {
        id: 'new_ability_id',
        name: 'Ability Name',
        description: 'Full description from the rulebook.',
        actionCost: 1, // or 'free', 'reaction', 'special', 'passive'
        category: AbilityCategory.RADIANT_UNIVERSAL,
        source: 'Source of ability (e.g., "First Ideal")',
        
        // Optional fields:
        specialActivation: 'When/how it can be used',
        resourceCost: {
            resourceType: 'investiture', // or 'focus', 'health'
            amount: 1 // or a string like "1d6 + tier"
        },
        canUseWhileUnconscious: false,
        limitations: [
            'Limitation 1',
            'Limitation 2'
        ],
        effects: [
            'Effect bullet point 1',
            'Effect bullet point 2'
        ]
    }
];
```

### Step 2: Integrate with Character State

If the ability should appear based on character state (not always present), update the `getAvailableAbilities()` function:

```typescript
export function getAvailableAbilities(
    hasSpokenFirstIdeal: boolean,
    // Add more parameters as needed
    hasSpecialItem: boolean = false
): UniversalAbility[] {
    const abilities: UniversalAbility[] = [];
    
    if (hasSpokenFirstIdeal) {
        abilities.push(...RADIANT_UNIVERSAL_ABILITIES);
    }
    
    if (hasSpecialItem) {
        abilities.push(...SPECIAL_ITEM_ABILITIES);
    }
    
    return abilities;
}
```

Then update the relevant manager (e.g., `RadiantPathManager`, `InventoryManager`, etc.) to call this function with appropriate parameters.

### Step 3: Update Character Class (if needed)

If you're adding abilities from a new source, update `Character.getUniversalAbilities()`:

```typescript
getUniversalAbilities(): UniversalAbility[] {
    const abilities: UniversalAbility[] = [];
    
    // Existing sources
    abilities.push(...this.radiantPathManager.getUniversalAbilities());
    
    // Add new source
    abilities.push(...this.specialItemManager.getUniversalAbilities());
    
    return abilities;
}
```

## Examples of Different Ability Types

### Example 1: Action with Resource Cost (Regenerate)

```typescript
{
    id: 'regenerate',
    name: 'Regenerate',
    description: 'Spend 1 Investiture to recover health equal to 1d6 + your current tier.',
    actionCost: 'free',
    category: AbilityCategory.RADIANT_UNIVERSAL,
    source: 'First Ideal',
    resourceCost: {
        resourceType: 'investiture',
        amount: 1
    },
    canUseWhileUnconscious: true,
    effects: [
        'Spend 1 Investiture',
        'Recover health = 1d6 + tier',
        'Can be used even while Unconscious'
    ]
}
```

### Example 2: Special Activation (Enhance)

```typescript
{
    id: 'enhance',
    name: 'Enhance',
    description: 'Spend 1 Investiture to become Enhanced [Strength +1] and Enhanced [Speed +1]...',
    actionCost: 1,
    category: AbilityCategory.RADIANT_UNIVERSAL,
    source: 'First Ideal',
    resourceCost: {
        resourceType: 'investiture',
        amount: 1
    },
    effects: [
        'Spend 1 Investiture',
        'Gain Enhanced [Strength +1] until end of next turn',
        'Gain Enhanced [Speed +1] until end of next turn',
        'Can maintain with free action'
    ]
}
```

### Example 3: Item-Granted Passive (Hypothetical Shardplate)

```typescript
{
    id: 'shardplate_protection',
    name: 'Shardplate Protection',
    description: 'While wearing Shardplate, you gain significant protection against damage.',
    actionCost: 'passive',
    category: AbilityCategory.ITEM_GRANTED,
    source: 'Shardplate',
    effects: [
        'Reduces incoming damage',
        'Provides enhanced defenses',
        'Can be cracked by powerful attacks'
    ],
    limitations: [
        'Only while wearing Shardplate',
        'Plates can crack under heavy damage'
    ]
}
```

## Ability Categories

The system includes several predefined categories:

- **RADIANT_UNIVERSAL**: Abilities all Radiants get (e.g., Breathe Stormlight, Enhance, Regenerate)
- **RADIANT_ORDER_SPECIFIC**: Abilities specific to a Radiant Order
- **ITEM_GRANTED**: Abilities from special items
- **CONDITION**: Abilities from temporary conditions
- **SPECIAL_RULE**: One-off rules from the rulebook
- **OTHER**: Catch-all for miscellaneous abilities

Add new categories as needed in `universalAbilities.ts`.

## Current Implementation

### Radiant Universal Abilities

Currently implemented:
1. **Breathe Stormlight** (2 actions) - Recover Investiture from infused spheres
2. **Enhance** (1 action) - Spend Investiture to enhance Strength and Speed
3. **Regenerate** (free action) - Spend Investiture to heal

These abilities appear automatically when a character speaks the First Ideal.

### Singer Forms

All Singer forms are now implemented as universal abilities. When a character unlocks a "Forms of X" talent, the corresponding forms are granted as universal abilities:

**Forms of Finesse** (Tier 1):
- **Nimbleform** - Speed +1, Focus +2
- **Artform** - Awareness +1, expertise in Painting and Music, advantage on Crafting/entertainment

**Forms of Wisdom** (Tier 1):
- **Meditationform** - Presence +1, can aid without spending focus
- **Scholarform** - Intellect +1, temporary expertise and skill rank

**Forms of Resolve** (Tier 1):
- **Warform** - Strength +1, Physical Deflect +1
- **Workform** - Willpower +1, ignore Exhausted, disguise as parshman

**Forms of Destruction** (Tier 4, requires Voidspren bond):
- **Direform** - Strength +2, Physical Deflect +2, reactive grapple
- **Stormform** - Strength +1, Speed +1, Physical Deflect +1, grants Unleash Lightning

**Forms of Expansion** (Tier 4, requires Voidspren bond):
- **Envoyform** - Intellect +1, Presence +1, know all languages, Insight advantage
- **Relayform** - Speed +2, ignore Slowed, focus for agility advantage

**Forms of Mystery** (Tier 4, requires Voidspren bond):
- **Decayform** - Willpower +2, prevent healing/focus recovery
- **Nightform** - Awareness +1, Intellect +1, Focus +2, preroll d20s for visions

**Singer Form Actions**:
- **Change Form** (3 actions) - Change forms during highstorm
- **Unleash Lightning** (2 actions) - Stormform only, ranged lightning attack

The talent system automatically grants these forms when the appropriate talents are unlocked via the `talentEffects.ts` module.

## UI Display

Abilities are displayed in the **Powers** tab of the character sheet, in a separate "Universal Abilities" section at the top. The UI shows:

- Ability name and category badge
- Action cost
- Full description
- Resource costs (if any)
- Effects (bullet points)
- Limitations (if any)
- Source
- Special indicators (e.g., "Usable while unconscious")

## Future Enhancements

Potential additions to the system:

1. **Usage Tracking**: Track how many times per day/scene an ability can be used
2. **Conditional Display**: Hide abilities that aren't currently usable
3. **Quick Actions**: Allow players to trigger abilities directly from the sheet
4. **Dice Rolling Integration**: Integrate with dice rolling for abilities that require rolls
5. **Automation**: Automatically apply effects when abilities are used

## Tips for Adding Rulebook Content

When you find new one-off rules in the rulebook:

1. **Categorize**: Determine if it's better as a Universal Ability or a Talent
2. **Be Complete**: Copy the full text from the rulebook into the description
3. **Break Down Effects**: Use the `effects` array for clear, scannable bullet points
4. **Note Prerequisites**: Even simple abilities might require character state checks
5. **Test Display**: Check how it looks in the UI - long descriptions might need formatting
6. **Document Source**: Always include the source (page number, section, etc.)

## Examples of Rules That Fit Well

Good candidates for Universal Abilities:
- Singer form abilities
- Special actions granted by conditions
- One-time use items
- Environmental abilities (e.g., "While in a highstorm...")
- Racial/species abilities that aren't tied to progression

## Questions?

If you're unsure whether something should be a Universal Ability or a Talent, ask:
1. Does it have complex prerequisites beyond character state?
2. Is it part of a progression path?
3. Does it grant bonuses that should be managed by the bonus system?

If yes to any of these, it's probably better as a Talent. Otherwise, Universal Ability is a great fit!
