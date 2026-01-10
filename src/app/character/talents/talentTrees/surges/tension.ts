import { TalentTree, ActionCostCode } from "../../talentInterface";

export const TENSION_SURGE_TREE: TalentTree = {
    pathName: "Tension",
    nodes: [
        {
            id: 'tension_base',
            name: 'Tension',
            description: 'To use this surge, spend 1 or more Investiture to infuse a soft object within your reach; you must have a hand free and touch the target. The infusion uses 1 Investiture each round, and for the duration, the object becomes completely rigid. This object can\'t exceed the surge size for your ranks in Tension. When you activate this surge, you can first form the soft material into a rough shape as part of that action, but any elaborate molding requires more time (see "Creating Objects and Weapons"). You can\'t use this surge on characters, Invested objects (like Shardplate), or objects that have been infused with Stormlight (like infused spheres or objects affected by surges). Hardened Defense: When you infuse a soft material worn by you or a willing character, you can increase the wearer\'s Physical defense by 2. Alternatively, before you infuse a material, you can wrap it around a character as part of that action, granting the same effect. A character\'s Physical defense can\'t benefit from more than one Tension surge at a time.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'TENSION', value: 1 }
            ],
            tier: 0,
            bonuses: [],
            otherEffects: [
                'Infuse soft object to make it rigid',
                'Uses 1 Investiture per round',
                'Can shape material roughly as part of action',
                'Hardened Defense: +2 Physical defense when worn (doesn\'t stack)',
                'Can\'t affect characters, Invested objects, or Stormlight-infused objects'
            ]
        },
        {
            id: 'tension_tension_parry',
            name: 'Tension Parry',
            description: 'You stiffen clothing to block incoming attacks. Before you or an ally within your reach is hit or grazed by an attack against Physical defense, you can use this reaction to infuse Tension into the target\'s clothing or a soft material you wrap around the target, spending Investiture as usual. They gain the Hardened Defense effect, increasing their Physical defense by 2 for the duration, including against the triggering attack. If the attack hit, this increase can change it to a miss. If the attack grazed, the target ignores its effects.',
            actionCost: ActionCostCode.Reaction,
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'skill', target: 'TENSION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'React before hit/graze to infuse target\'s clothing',
                'Target gains Hardened Defense: +2 Physical defense',
                'Can turn hit into miss or negate graze'
            ]
        },
        {
            id: 'tension_stormlight_reclamation',
            name: 'Stormlight Reclamation',
            description: 'You can reclaim Stormlight from active infusions. After your infusions expend their infused Investiture at the start of your turn, you can end any number of those infusions within your reach, recovering all remaining Investiture they were infused with.',
            actionCost: ActionCostCode.Free,
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'skill', target: 'TENSION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: ['Recover Investiture from infusions within reach']
        },
        {
            id: 'tension_rigged_weaponry',
            name: 'Rigged Weaponry',
            description: 'Dynamic use of Tension on cloth or rope allows you to augment your martial prowess. While wielding a melee weapon and holding cloth or other flexible object that\'s at least 10 feet long, you can spend 1 Investiture as Free to increase the weapon\'s reach by 10 feet until the end of your next turn. Additionally, after you hit a character with a melee attack, you can spend C or 2 focus to use Tension on an object the target is holding or wearing, infusing Investiture as usual but without spending an action. You automatically succeed on the test to infuse it.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'While wielding melee weapon with 10+ foot cloth/rope, or after hitting with melee attack',
            prerequisites: [
                { type: 'talent', target: 'tension_tension_parry' },
                { type: 'skill', target: 'TENSION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'Spend 1 Investiture as Free to increase weapon reach by 10 feet',
                'After melee hit, spend C or 2 focus to use Tension without action',
                'Auto-succeed on infusion test'
            ]
        },
        {
            id: 'tension_extended_tension',
            name: 'Extended Tension',
            description: 'Your infusions of Tension expend the Stormlight far less quickly. When you infuse Tension into an object, instead of the infusion expending 1 Investiture per round, it expends 1 Investiture per number of rounds equal to your ranks in Tension. For example, if you have 3 ranks in Tension, those infusions expend Investiture once every 3 rounds. Additionally, while you have 1 Investiture or more, you can maintain Tension infusions on objects you\'re holding or wearing without either you or the infusion expending Investiture.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'tension_stormlight_reclamation' },
                { type: 'skill', target: 'TENSION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'Tension infusions expend 1 Investiture per X rounds (X = Tension ranks)',
                'With 1+ Investiture, maintain infusions on held/worn objects without cost'
            ]
        },
        {
            id: 'tension_cloth_mastery',
            name: 'Cloth Mastery',
            description: 'As you infuse soft materials with Tension, they contort themselves into exactly what you envision. When you use Tension to create an object or weapon, you can automatically reshape it before it becomes rigid without using additional actions or time. When you do, you instantaneously mold the soft material into an object as elaborate, intricate, and complex as you wish. For example, you could turn a large tarp into a table or chair, shape a cloak around its wearer as a functioning suit of half plate, cause a grappling hook attached to a rope to secure itself to a ledge above, or create intricate shapes or images.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'tension_rigged_weaponry' },
                { type: 'skill', target: 'TENSION', value: 2 }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: [
                'Automatically reshape objects when infusing without extra actions',
                'Create elaborate, intricate, complex shapes instantly'
            ]
        },
        {
            id: 'tension_surface_tension',
            name: 'Surface Tension',
            description: 'You use Tension to solidify the surface of liquids into traversable ground. You can use Tension on liquid, affecting an area up to twice the size you can normally affect with your ranks in Tension. For the duration, this liquid\'s surface tension increases and characters can walk on it like solid ground.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'tension_extended_tension' },
                { type: 'skill', target: 'TENSION', value: 3 }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: [
                'Use Tension on liquid (2× normal size)',
                'Characters can walk on liquid surface'
            ]
        },
        {
            id: 'tension_fine_control',
            name: 'Fine Control',
            description: 'Your careful practice allows you to selectively change the rigidity of an object\'s parts, allowing fine control much like the movement of muscles and tendons. Infuse 1 Investiture or more into an unattended object within reach that is of a size you can affect with Tension. Though the infused object isn\'t a character, for the duration, its current and maximum health both increase to 5 × your ranks in Tension, and each of its defenses equals 10 + your Tension modifier. If the infused object is reduced to 0 health, the infusion ends early and the object breaks. Many Tension users infuse long pieces of cloth, rope, or other flexible material that they can control, effectively extending their range. On each of your turns for the duration, while touching part of one object you infused using this talent, you can move it up to 25 feet along surfaces (including ceilings) and can use it to interact with characters and other objects. You can use C to have one infused object perform simple tasks like climbing a tree or opening a door. You can use C to task one infused object with something that requires a test or your careful attention, such as attacking someone or writing a message. The object has no senses of its own and can\'t act without your touch and direct control, so you can\'t give it tasks that require senses or knowledge you don\'t have. If the object\'s task requires a test (such as an attack or Athletics test), you must be able to sense its target, and you use your Tension instead of that test\'s usual skill. The object can make a melee attack using Tension against the Physical defense of a target within 5 feet of it, rolling 2d4 impact damage. The size of these dice increases with your ranks in Tension; at 2 ranks, roll 2d6 (instead of 2d4), and so on.',
            actionCost: 2,
            prerequisites: [
                { type: 'talent', target: 'tension_cloth_mastery' },
                { type: 'skill', target: 'TENSION', value: 3 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'Infused object gains health: 5 × Tension ranks',
                'Object defenses: 10 + Tension modifier',
                'Move object 25 feet while touching it',
                'Spend C for simple tasks or tests using Tension',
                'Attack damage: 2d4 (rank 1), 2d6 (rank 2), 2d8 (rank 3), etc.'
            ]
        },
        {
            id: 'tension_clothsmith',
            name: 'Clothsmith',
            description: 'The impromptu weapons and armor you create with Tension are so powerful that they rival Shardblades and Plate. When you infuse Tension to grant a character the Hardened Defense effect, their Physical defense increases by 4 (instead of 2). Additionally, when you temporarily create a weapon with Tension (see "Creating Objects and Weapons"), it gains an extra d4 damage die (for example, an axe created this way deals 1d6 + 1d4 keen damage). The size of this die increases with your ranks in Tension; at 2 ranks, the extra die becomes a d6 (instead of a d4), and so on.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'TENSION', value: 4 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'Hardened Defense grants +4 Physical defense (instead of +2)',
                'Created weapons gain extra damage die: 1d4 (rank 1), 1d6 (rank 2), etc.'
            ]
        }
    ]
};
