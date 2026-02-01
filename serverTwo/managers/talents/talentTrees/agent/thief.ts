import { TalentTree } from "../../talentInterface";

export const THIEF_TALENT_TREE: TalentTree = {
  pathName: 'Thief',
  nodes: [
    {
        id: 'riskyBehavior',
        name: 'Risky Behavior',
        description: 'Spend 1 focus to raise the stakes on your test.',
        actionCost: -1, // Special
        specialActivation: 'Spend 1 focus to raise the stakes on your test.',
        prerequisites: [
            { type: 'skill', target: 'Insight', value: 2}
        ],
        tier: 1,
        bonuses: [],
    },
    {
        id: 'cheapShot',
        name: 'Cheap Shot',
        description: 'Spend 1 focus to make an unarmed attack with Thievery vs Cognitive, raising the stakes. On a hit, the target is stunned.',
        actionCost: 1, //1 action
        prerequisites: [],
        tier: 1,
        bonuses: [],
        otherEffects: [
            'Spend 1 focus to make an unarmed attack with Thievery vs Cognitive, raising the stakes. On a hit, the target is stunned.'
        ]
    },
    {
        id: 'doubleDown',
        name: 'Double Down',
        description: 'You can reroll again with Opportunist, but on a complication, you lose 2 focus.',
        actionCost: -2, // Special
        specialActivation: 'You can reroll again with Opportunist, but on a complication, you lose 2 focus.',
        prerequisites: [
            { type: 'talent', target: 'opportunist' },
            { type: 'talent', target: 'riskyBehavior' },
        ],
        tier: 2,
        bonuses: [],
    },
    {
        id: 'surefooted',
        name: 'Surefooted',
        description: 'Your movement increases by 10. Reduce Damage from falling and dnagerous terrain by twice your tier.',
        actionCost: Infinity, // Passive
        prerequisites: [
            { type: 'talent', target: 'cheapShot' },
        ],
        tier: 2,
        bonuses: [],
    },
    {
        id: 'underworldContacts',
        name: 'Underworld Contacts',
        description: 'Gain Criminal Groups expertise. Spend 2 focus to add an opportunity to a social test against criminals.',
        actionCost: -2, // Special
        specialActivation: 'Spend 2 focus to add an opportunity to a social test against criminals.',
        prerequisites: [
            { type: 'talent', target: 'doubleDown'},
        ],
        tier: 3,
        bonuses: [],        
    },
    {
        id: 'shadowStep',
        name: 'Shadow Step',
        description: 'After you Disengage, spend 2 focus to test Thievery vs each enemy\'s Cognitive to hide from them. You gain an advantage if in cover or obscured.',
        actionCost: 0, // Free
        prerequisites: [
            { type: 'talent', target: 'surefooted' },
            {type: 'skill', target: 'Thievery', value: 3},
        ],
        tier: 3,
        bonuses: [],
        otherEffects: [
            'After you Disengage, spend 2 focus to test Thievery vs each enemy\'s Cognitive to hide from them. You gain an advantage if in cover or obscured.'
        ]
    },
    {
        id: 'fastTalker',
        name: 'Fast Talker',
        description: 'Spend 2 focus to gain two actions for spiritual tests with use a skill, gain advantage, or an agent talent.',
        actionCost: 0, // Free
        prerequisites: [
            { type: 'talent', target: 'doubleDown'},
            { type: 'skill', target: 'Insight', value: 3},
        ],
        tier: 4,
        bonuses: [],
        otherEffects: [
            'Spend 2 focus to gain two actions for spiritual tests with use a skill, gain advantage, or an agent talent.'
        ]
    },
    {
        id: 'trickster\'shand',
        name: 'Trickster\'s Hand',
        description: 'Spend 2 focus to gain two actions for physical tests with Use a Skill, gain advantage, or an agent talent.',
        actionCost: 0, // Free
        prerequisites: [
            { type: 'talent', target: 'surefooted' },
        ],
        tier: 4,
        bonuses: [],
        otherEffects: [
            'Spend 2 focus to gain two actions for physical tests with Use a Skill, gain advantage, or an agent talent.'
        ]
    }

  ],
}