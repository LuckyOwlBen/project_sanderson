import { TalentTree, ActionCostCode } from "../../talentInterface";

export const PROGRESSION_SURGE_TREE: TalentTree = {
    pathName: "Progression",
    nodes: [
        {
            id: 'progression_base',
            name: 'Progression',
            description: 'You infuse life into a living thing other than yourself within your reach; you must have a hand free and touch the target. Plant Growth: If you target a living plant (or its seed) with Growth, spend 1 Investiture to cause it to rapidly grow to a size of your choice. This can\'t exceed the surge size for your ranks in Progression, nor the normal limits of the largest plants of its species. Character Regrowth: If you target a living character with Regrowth, infuse 1 Investiture or more into them. The infusion uses 1 Investiture each round, and for the duration, that character recovers health equal to 1d4 + your Progression modifier at the start of each of their turns. The size of this die increases with your ranks in Progression: at 2 ranks, roll 1d6 when recovering health (instead of 1d4), and so on.',
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'PROGRESSION', value: 1 }
            ],
            tier: 0,
            bonuses: [],
            otherEffects: [
                'Plant Growth: Spend 1 Investiture to grow plant to chosen size',
                'Regrowth: Infuse character to heal 1d4 + modifier per round',
                'Healing die scales: 1d4 (rank 1), 1d6 (rank 2), 1d8 (rank 3), etc.',
                'Uses 1 Investiture per round for Regrowth'
            ]
        },
        {
            id: 'progression_injury_regrowth',
            name: 'Injury Regrowth',
            description: 'You use Regrowth to rapidly recover injuries, including permanent ones and missing body parts. Spend 2 Investiture to cause yourself or a willing character you touch to instantly recover from a temporary injury of the target\'s choice, or spend 3 Investiture to recover from a permanent injury.',
            actionCost: 2,
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'skill', target: 'PROGRESSION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Spend 2 Investiture to recover from temporary injury',
                'Spend 3 Investiture to recover from permanent injury'
            ]
        },
        {
            id: 'progression_explosive_growth',
            name: 'Explosive Growth',
            description: 'You grow plants explosively, striking and ensnaring your enemies. Spend 1 Investiture to use Growth in an area up to the size you can affect with your ranks in Progression. Make one Progression attack and compare the test result to the Physical defense of each character of your choice in that area. Roll 2d4 damage, dealing either impact or keen damage (whichever is logical for the grown plants). The size of this attack\'s damage dice increases with your ranks in Progression; at 2 ranks, roll 2d6 (instead of 2d4), and so on. You can spend C to cause any number of the targets you hit to become Immobilized until the end of your next turn.',
            actionCost: 2,
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'skill', target: 'PROGRESSION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Spend 1 Investiture for area attack',
                'Damage: 2d4 (rank 1), 2d6 (rank 2), 2d8 (rank 3), etc.',
                'Spend C to Immobilize targets until end of your next turn'
            ]
        },
        {
            id: 'progression_swift_regeneration',
            name: 'Swift Regeneration',
            description: 'You can heal yourself with greater efficiency and make those infused with your Regrowth more resistant to injury. When you use Regenerate, instead of recovering the normal amount of health, you can recover health equal to 1d6 + your Progression modifier. The size of this die increases with your ranks in Progression: at 3 ranks, roll 1d8 (instead of 1d6), and so on. Additionally, while you have 1 Investiture or more, you and any character infused with your Regrowth can add your Progression modifier to injury rolls.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'When you use Regenerate',
            prerequisites: [
                { type: 'talent', target: 'progression_injury_regrowth' },
                { type: 'skill', target: 'PROGRESSION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'Recover 1d6 + Progression modifier health (1d8 at rank 3, etc.)',
                'With 1+ Investiture, you and Regrowth targets add Progression modifier to injury rolls'
            ]
        },
        {
            id: 'progression_overgrowth',
            name: 'Overgrowth',
            description: 'You persuade plants to grow beyond their normal size and shape. When you infuse Growth into a plant, you can make a DC 15 Progression test as part of that action. On a success, you cause the plant to grow beyond its species\' normal limits, up to the surge size for your ranks in Progression, and the plant\'s current and total health increase by 2d4. The size of these dice increases with your ranks in Progression; at 2 ranks, roll 2d6 (instead of 2d4), and so on.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'progression_explosive_growth' },
                { type: 'skill', target: 'PROGRESSION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'DC 15 Progression test to grow plant beyond normal limits',
                'Plant health increases: 2d4 (rank 1), 2d6 (rank 2), 2d8 (rank 3), etc.'
            ]
        },
        {
            id: 'progression_extended_regrowth',
            name: 'Extended Regrowth',
            description: 'Your Regrowth infusions expend Stormlight far less quickly. When you infuse Regrowth into a character, instead of the infusion expending 1 Investiture per round, it expends 1 Investiture per number of rounds equal to your ranks in Progression. For example, if you have 3 ranks in Progression, those infusions expend Investiture once every 3 rounds.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'progression_swift_regeneration' },
                { type: 'skill', target: 'PROGRESSION', value: 3 }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ['Regrowth infusions expend 1 Investiture per X rounds (X = Progression ranks)']
        },
        {
            id: 'progression_reliable_progression',
            name: 'Reliable Progression',
            description: 'Through adept control of your Stormlight, your Growth and Regrowth become even more dependable. When you roll a die whose size increases with your ranks in Progression (such as when using the Explosive Growth, Overgrowth, and Swift Regeneration talents) or when a willing character rolls a die to recover health from your Regrowth, if the die rolls a number lower than your ranks in Progression, you can change that result to instead equal your ranks in Progression (no action required).',
            actionCost: ActionCostCode.Special,
            specialActivation: 'When rolling Progression-scaled dice',
            prerequisites: [
                { type: 'talent', target: 'progression_overgrowth' },
                { type: 'skill', target: 'PROGRESSION', value: 2 }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: [
                'Increase low die rolls to match Progression ranks',
                'Applies to Explosive Growth, Overgrowth, Swift Regeneration, and Regrowth healing'
            ]
        },
        {
            id: 'progression_from_the_brink',
            name: 'From the Brink',
            description: 'You use Regrowth to pull someone back from the very edge of death. Spend 3 Investiture and touch the body of a character who died within the last minute. If the target is willing, they return to life Unconscious with 0 health.',
            actionCost: 3,
            prerequisites: [
                { type: 'talent', target: 'progression_extended_regrowth' },
                { type: 'skill', target: 'PROGRESSION', value: 3 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'Spend 3 Investiture to resurrect recently deceased (within 1 minute)',
                'Target returns Unconscious with 0 health'
            ]
        },
        {
            id: 'progression_font_of_life',
            name: 'Font of Life',
            description: 'You\'ve grown so powerful that growth and healing flow from you with incredible speed. It costs you one C fewer to use Progression and its talents.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'PROGRESSION', value: 4 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ['Progression and its talents cost 1 fewer C']
        }
    ]
};
