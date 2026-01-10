import { TalentTree, ActionCostCode } from "../../talentInterface";

export const GRAVITATION_SURGE_TREE: TalentTree = {
    pathName: "Gravitation",
    nodes: [
        {
            id: 'gravitation_base',
            name: 'Gravitation (Basic Lashing)',
            description: 'To perform a Basic Lashing, spend 1 Investiture or more to infuse a character or object within your reach; you must have a hand free and touch the target. Your target can\'t exceed the surge size for your ranks in Gravitation. The infusion uses 1 Investiture each round, and for the duration, the target\'s gravity changes directions. This change uses your gravitation rate, which begins at 25 feet. Your target doesn\'t move fast enough to deal damage on impact. However, if a target is aloft when the surge ends, they fall and take the usual damage from the fall. Targeting a Character: You can target a willing character, granting them a flying rate equal to your gravitation rate for the duration. Alternatively, you can infuse yourself with Gravitation regardless of your size, gaining the same flying rate and spending 1 Investiture each round to maintain the surge. To target an unwilling character, see "Gravitation on Others." Targeting an Object: You can target an object, declaring a new direction for its gravity. At the start of each of your turns, after the infusion expends another 1 Investiture, move that object in a straight line up to your gravitation rate. You can\'t use this surge on Invested objects (like Shardplate) or objects that have been infused with Stormlight (like infused spheres or objects affected by surges).',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'GRAVITATION', value: 1 }
            ],
            tier: 0,
            bonuses: [],
            otherEffects: [
                'Grant flying rate to willing characters (gravitation rate, starts at 25 feet)',
                'Infuse self for flight regardless of size',
                'Move objects by changing gravity direction',
                'Uses 1 Investiture per round',
                'Can\'t affect Invested or Stormlight-infused objects'
            ]
        },
        {
            id: 'gravitation_flying_ace',
            name: 'Flying Ace',
            description: 'You are a master of the skies, adeptly wielding your weapon while in flight. While maintaining a Basic Lashing on yourself, fly a distance up to your gravitation rate. Once during this movement, you can spend 1 focus to make a melee weapon attack as part of the same action. After resolving that attack, you can continue your movement. Additionally, when you acquire this talent, your gravitation rate increases to 40 feet.',
            actionCost: 1,
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'skill', target: 'GRAVITATION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Fly up to gravitation rate while maintaining Basic Lashing',
                'Spend 1 focus to make melee attack during movement',
                'Gravitation rate increases to 40 feet'
            ]
        },
        {
            id: 'gravitation_gravitational_slam',
            name: 'Gravitational Slam',
            description: 'Your Basic Lashings become more forceful and potentially dangerous on impact. When you use a Basic Lashing to move an unwilling creature or object into a solid surface, the collision stops that movement early, and you can choose for the Lashed target to take 1d4 impact damage for every 10 feet they were moved with that Lashing on this turn. For example, if you moved them 25 feet then they collide with a wall, they take 2d4 impact damage. Your target can use the Avoid Danger reaction to make an Agility test opposed by your Gravitation, taking half as much damage on a success. The size of these damage dice increases with your ranks in Gravitation; at 2 ranks, roll 1d6 (instead of 1d4), and so on.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'skill', target: 'GRAVITATION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Lashed targets take damage on collision: 1d4 per 10 feet moved',
                'Damage dice scale with ranks: 1d6 at rank 2, 1d8 at rank 3, etc.',
                'Target can halve damage with Agility test (Avoid Danger reaction)'
            ]
        },
        {
            id: 'gravitation_stable_flight',
            name: 'Stable Flight',
            description: 'You\'re an expert in launching attacks from afar in mid-flight. While maintaining a Basic Lashing on yourself, your ranged attacks don\'t gain a disadvantage due to flying or other causes of unstable footing.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'gravitation_flying_ace' },
                { type: 'skill', target: 'GRAVITATION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['No disadvantage on ranged attacks while flying']
        },
        {
            id: 'gravitation_multiple_lashings',
            name: 'Multiple Lashings',
            description: 'You can apply multiple Basic Lashings to an enemy. After you succeed on a Gravitation test to move an unwilling character, you can infuse them with an amount of Investiture up to your ranks in Gravitation (instead of only 1 Investiture). When you do, the effect continues until the infusion ends (instead of until the start of your next turn).',
            actionCost: ActionCostCode.Special,
            specialActivation: 'After you succeed on a Gravitation test to move an unwilling character',
            prerequisites: [
                { type: 'talent', target: 'gravitation_gravitational_slam' },
                { type: 'skill', target: 'GRAVITATION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'Infuse unwilling target with up to X Investiture (X = Gravitation ranks)',
                'Effect lasts until infusion ends (not just until your next turn)'
            ]
        },
        {
            id: 'gravitation_lashing_shot',
            name: 'Lashing Shot',
            description: 'You apply multiple Basic Lashings to an object, launching it with several times the force of gravity. You touch an unattended object of a size you can affect with your ranks in Gravitation, then you propel that object at a target in your line of effect, spending Investiture equal to the distance to that target divided by your gravitation rate (rounded up). Make a ranged Gravitation attack against the Physical defense of that target, rolling 2d4 impact damage. The size of these damage dice increases with your ranks in Gravitation; at 2 ranks, roll 2d6 (instead of 2d4), and so on.',
            actionCost: 2,
            prerequisites: [
                { type: 'talent', target: 'gravitation_gravitational_slam' },
                { type: 'skill', target: 'GRAVITATION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'Launch object at target within line of effect',
                'Investiture cost: distance ÷ gravitation rate (rounded up)',
                'Damage: 2d4 (rank 1), 2d6 (rank 2), 2d8 (rank 3), etc.'
            ]
        },
        {
            id: 'gravitation_group_flight',
            name: 'Group Flight',
            description: 'You can infuse multiple allies with Gravitation at once. While not in combat, when you spend 1 Investiture or more to infuse yourself or a willing character with a Basic Lashing, you can also infuse a number of additional willing characters up to your ranks in Gravitation. Each target must be within your reach. These infusions last for the duration of the original infusion and require no additional Investiture to create or maintain.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'gravitation_stable_flight' },
                { type: 'skill', target: 'GRAVITATION', value: 3 }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: [
                'While not in combat, infuse up to X allies (X = Gravitation ranks)',
                'Allies must be within reach',
                'No additional Investiture cost to create or maintain'
            ]
        },
        {
            id: 'gravitation_aerial_squadron',
            name: 'Aerial Squadron',
            description: 'You\'ve trained your allies in aerial combat scenarios, readying them to fly together at a moment\'s notice. You can use your Group Flight in combat.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'gravitation_group_flight' },
                { type: 'skill', target: 'GRAVITATION', value: 3 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ['Can use Group Flight in combat']
        },
        {
            id: 'gravitation_master_of_the_skies',
            name: 'Master of the Skies',
            description: 'You\'ve become so efficient at infusing yourself with Gravitation that it becomes subconscious, allowing you to endlessly soar. While you have 1 Investiture or more, you gain the benefits of being infused with Gravitation without spending Investiture.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'GRAVITATION', value: 4 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'Gain Gravitation infusion benefits with 1+ Investiture without spending it'
            ]
        }
    ]
};
