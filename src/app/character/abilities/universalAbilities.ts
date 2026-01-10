/**
 * Universal Abilities System
 * 
 * This module manages special one-off abilities, powers, and rules that characters gain
 * from various sources (Radiant paths, special items, conditions, etc.)
 * 
 * Abilities are different from talents - they're simpler actions or passive effects
 * that don't require talent trees but should be tracked and displayed to players.
 */

export enum AbilityCategory {
    RADIANT_UNIVERSAL = 'Radiant Universal',
    RADIANT_ORDER_SPECIFIC = 'Radiant Order Specific',
    ITEM_GRANTED = 'Item Granted',
    CONDITION = 'Condition',
    SPECIAL_RULE = 'Special Rule',
    OTHER = 'Other'
}

export interface UniversalAbility {
    id: string;
    name: string;
    description: string;
    actionCost: number | 'free' | 'reaction' | 'special' | 'passive';
    category: AbilityCategory;
    source: string; // Where the ability comes from (e.g., "First Ideal", "Shardplate", etc.)
    
    // Optional fields for complex abilities
    specialActivation?: string; // When/how it can be used if actionCost is 'special'
    resourceCost?: {
        resourceType: 'investiture' | 'focus' | 'health';
        amount: number | string; // number or formula like "1d6 + tier"
    };
    canUseWhileUnconscious?: boolean;
    limitations?: string[]; // Special limitations or conditions
    effects?: string[]; // Bullet points of what the ability does
}

/**
 * Universal Radiant Abilities
 * These are granted to all Radiants who have spoken the First Ideal
 */
export const RADIANT_UNIVERSAL_ABILITIES: UniversalAbility[] = [
    {
        id: 'breathe_stormlight',
        name: 'Breathe Stormlight',
        description: 'You draw Stormlight into yourself from infused spheres within 5 feet of you; if you have enough spheres, you recover Investiture up to your maximum. In normal times, dun spheres can be readily exchanged for infused spheres, and highstorms occur regularly. If you have at least three times as many marks as your Investiture total, it\'s assumed you have enough infused spheres to draw from. In some situations, the GM may ask you to keep track of how many of your spheres are infused. On those occasions, you recover 1 Investiture for each infused mark or broam you drain.',
        actionCost: 2,
        category: AbilityCategory.RADIANT_UNIVERSAL,
        source: 'First Ideal',
        canUseWhileUnconscious: true,
        effects: [
            'Draw Stormlight from infused spheres within 5 feet',
            'Recover Investiture up to maximum',
            'If you have 3× your Investiture total in marks, assume you have enough spheres',
            'When tracking spheres: recover 1 Investiture per infused mark/broam drained',
            'Can be used even while Unconscious'
        ]
    },
    {
        id: 'enhance',
        name: 'Enhance',
        description: 'Spend 1 Investiture to become Enhanced [Strength +1] and Enhanced [Speed +1] until the end of your next turn. At the end of that turn and each of your turns thereafter, you can spend 1 Investiture as a free action to maintain these conditions until the end of your next turn.',
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
            'Can spend 1 Investiture as free action at end of turn to maintain'
        ]
    },
    {
        id: 'regenerate',
        name: 'Regenerate',
        description: 'Spend 1 Investiture to recover health equal to 1d6 + your current tier; for example, a tier 2 character recovers 1d6 + 2 health. You can use this free action even if you\'re Unconscious or otherwise prevented from using actions.',
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
];

/**
 * Singer Forms
 * These are the various forms that Singers can assume during highstorms
 */
export const SINGER_FORMS: UniversalAbility[] = [
    // Basic Forms (available through Forms of Finesse)
    {
        id: 'nimbleform',
        name: 'Nimbleform',
        description: 'A form focused on agility and mental acuity. While in nimbleform, you gain enhanced speed and focus.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Finesse',
        effects: [
            'Speed +1',
            'Focus +2'
        ]
    },
    {
        id: 'artform',
        name: 'Artform',
        description: 'A form attuned to creativity and artistic expression. While in artform, you gain enhanced awareness and expertise in artistic endeavors.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Finesse',
        effects: [
            'Awareness +1',
            'Expertise in Painting',
            'Expertise in Music',
            'Advantage on Crafting tests',
            'Advantage on tests to entertain'
        ]
    },
    
    // Wisdom Forms (available through Forms of Wisdom)
    {
        id: 'meditationform',
        name: 'Meditationform',
        description: 'A form focused on inner peace and supporting others. While in meditationform, you can aid allies without expending focus.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Wisdom',
        effects: [
            'Presence +1',
            'Can aid without spending focus'
        ]
    },
    {
        id: 'scholarform',
        name: 'Scholarform',
        description: 'A form dedicated to learning and intellectual pursuits. While in scholarform, you gain enhanced intellect and temporarily acquire new knowledge.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Wisdom',
        effects: [
            'Intellect +1',
            'Temporarily gain a cultural or utility expertise',
            'Temporarily gain a rank in a non-surge cognitive skill'
        ]
    },
    
    // Resolve Forms (available through Forms of Resolve)
    {
        id: 'warform',
        name: 'Warform',
        description: 'A form built for combat and physical prowess. While in warform, you gain enhanced strength and natural armor.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Resolve',
        effects: [
            'Strength +1',
            'Physical Deflect +1'
        ]
    },
    {
        id: 'workform',
        name: 'Workform',
        description: 'A form suited for labor and endurance. While in workform, you can push through exhaustion and blend in with parshmen.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Resolve',
        effects: [
            'Willpower +1',
            'Ignore Exhausted condition',
            'Can disguise yourself as parshman'
        ]
    },
    
    // Destruction Forms (available through Forms of Destruction - requires Voidspren bond)
    {
        id: 'direform',
        name: 'Direform',
        description: 'A powerful combat form granted by bonding a Voidspren. While in direform, you become a formidable physical force.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Destruction (Voidspren)',
        effects: [
            'Strength +2',
            'Physical Deflect +2',
            'Can use reactive strikes to grapple instead of attacking'
        ]
    },
    {
        id: 'stormform',
        name: 'Stormform',
        description: 'A devastating form that channels the power of storms. While in stormform, you can unleash lightning against your foes.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Destruction (Voidspren)',
        effects: [
            'Strength +1',
            'Speed +1',
            'Physical Deflect +1',
            'Grants Unleash Lightning ability (see below)'
        ]
    },
    
    // Expansion Forms (available through Forms of Expansion - requires Voidspren bond)
    {
        id: 'envoyform',
        name: 'Envoyform',
        description: 'A diplomatic form enhanced by Voidspren bond. While in envoyform, you excel at persuasion and understanding.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Expansion (Voidspren)',
        effects: [
            'Intellect +1',
            'Presence +1',
            'Know all languages',
            'Advantage on Insight tests about the intentions of others'
        ]
    },
    {
        id: 'relayform',
        name: 'Relayform',
        description: 'A form attuned to speed and agility. While in relayform, you move with supernatural swiftness.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Expansion (Voidspren)',
        effects: [
            'Speed +2',
            'Ignore Slowed condition',
            'Can spend 1 focus for advantage on Agility, Stealth, or Thievery tests'
        ]
    },
    
    // Mystery Forms (available through Forms of Mystery - requires Voidspren bond)
    {
        id: 'decayform',
        name: 'Decayform',
        description: 'A sinister form that spreads entropy and prevents healing. While in decayform, you can suppress recovery.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Mystery (Voidspren)',
        effects: [
            'Willpower +2',
            'Can spend 1 focus or 1 Investiture to prevent a character within reach from recovering health or focus'
        ]
    },
    {
        id: 'nightform',
        name: 'Nightform',
        description: 'A mysterious form that grants visions of possible futures. While in nightform, you see glimpses of what may come.',
        actionCost: 'passive',
        category: AbilityCategory.OTHER,
        source: 'Singer Forms - Forms of Mystery (Voidspren)',
        effects: [
            'Awareness +1',
            'Intellect +1',
            'Focus +2',
            'Receive unpredictable glimpses of the future',
            'Preroll two d20s each session which you can use to replace enemy or ally d20 rolls'
        ]
    }
];

/**
 * Singer Form Special Abilities
 * These are activated abilities granted by certain forms
 */
export const SINGER_FORM_ABILITIES: UniversalAbility[] = [
    {
        id: 'unleash_lightning',
        name: 'Unleash Lightning',
        description: 'Channel the power of the storm through your body to strike distant foes with lightning. This ability is only available while in stormform.',
        actionCost: 2,
        category: AbilityCategory.OTHER,
        source: 'Stormform',
        resourceCost: {
            resourceType: 'focus',
            amount: '1 (or 1 Investiture)'
        },
        effects: [
            'Make a ranged Discipline attack (60 feet range) vs Physical defense',
            'On hit: Deal 2d8 energy damage',
            'On hit: Target becomes disoriented'
        ],
        limitations: [
            'Only usable while in stormform',
            'Requires 1 focus or 1 Investiture'
        ]
    },
    {
        id: 'change_form',
        name: 'Change Form',
        description: 'During a highstorm, you can change into dullform, mateform, or another one of your known singer forms. The transformation takes time and requires the chaotic energy of a highstorm.',
        actionCost: 3,
        category: AbilityCategory.OTHER,
        source: 'Singer Ancestry',
        effects: [
            'Change into any form you have unlocked',
            'Can only be used during a highstorm',
            'Transformation completes at end of action'
        ],
        limitations: [
            'Only during a highstorm',
            'Can only change to forms you have unlocked through talents'
        ]
    }
];

/**
 * Example of how other one-off abilities might be added
 * This demonstrates the flexibility of the system
 */
export const EXAMPLE_SPECIAL_ABILITIES: UniversalAbility[] = [
    // Example: Shardplate ability
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
        ]
    }
    // Add more as you discover them in the rulebook
];

/**
 * Get all abilities available to a character based on their state
 */
export function getAvailableAbilities(hasSpokenFirstIdeal: boolean): UniversalAbility[] {
    const abilities: UniversalAbility[] = [];
    
    if (hasSpokenFirstIdeal) {
        abilities.push(...RADIANT_UNIVERSAL_ABILITIES);
    }
    
    // Future: Add logic for other ability sources
    // - Check for specific items
    // - Check for conditions
    // - Check for special rules
    
    return abilities;
}

/**
 * Get Singer form abilities based on unlocked forms
 */
export function getSingerFormAbilities(unlockedFormIds: string[]): UniversalAbility[] {
    const abilities: UniversalAbility[] = [];
    
    // Add Change Form ability if character has Singer ancestry
    if (unlockedFormIds.length > 0) {
        const changeForm = SINGER_FORM_ABILITIES.find(a => a.id === 'change_form');
        if (changeForm) {
            abilities.push(changeForm);
        }
    }
    
    // Add unlocked forms
    for (const formId of unlockedFormIds) {
        const form = SINGER_FORMS.find(f => f.id === formId);
        if (form) {
            abilities.push(form);
        }
        
        // Add special abilities granted by forms
        if (formId === 'stormform') {
            const unleashLightning = SINGER_FORM_ABILITIES.find(a => a.id === 'unleash_lightning');
            if (unleashLightning) {
                abilities.push(unleashLightning);
            }
        }
    }
    
    return abilities;
}

/**
 * Format action cost for display
 */
export function formatActionCost(cost: number | string): string {
    if (typeof cost === 'number') {
        return cost === 1 ? '1 Action' : `${cost} Actions`;
    }
    
    switch (cost) {
        case 'free':
            return 'Free Action';
        case 'reaction':
            return 'Reaction';
        case 'special':
            return 'Special';
        case 'passive':
            return 'Passive';
        default:
            return String(cost);
    }
}
