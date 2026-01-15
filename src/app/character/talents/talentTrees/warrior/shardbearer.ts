import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const SHARDBEARER_TALENT_TREE: TalentTree = {
    pathName: 'Shardbearer',
    nodes: [
        {
            id: "shard_training",
            name: "Shard Training",
            description: "Once per round, when you use the Strike action to attack with a Shardblade, you can choose a number of additional enemies up to your ranks in the skill you used for that Strike. Each target must be within your Shardblade's reach. Without spending focus, you graze each additional target whose Physical defense is equal to or lower than your Strike's test result. Additionally, when you acquire this talent, gain a specialist expertise in Shardplate, and gain a specialist expertise in either Grandbows, Shardblades, or Warhammers. Finally, while you wear Shardplate, it has 2 additional charges for you.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Once per round when using Strike with Shardblade, can target additional enemies",
            prerequisites: [
                { type: 'talent', target: 'vigilant_stance' }
            ],
            tier: 1,
            bonuses: [],
            expertiseGrants: [
                { type: 'fixed', expertises: ['Shardplate'] },
                { type: 'choice', choiceCount: 1, options: ['Grandbows', 'Shardblades', 'Warhammers'] }
            ],
            otherEffects: ["Once per round: Strike with Shardblade can graze additional targets (up to skill ranks) if Physical defense ≤ test result", "Gain Shardplate specialist expertise", "Gain Grandbows, Shardblades, or Warhammers specialist expertise", "Shardplate has +2 charges for you", "Requires access to Shardblade and Shardplate for training"]
        },
        {
            id: "stonestance",
            name: "Stonestance",
            description: "When you acquire this talent, you learn a new stance, which you can enter as an action: Stonestance. While in this stance, increase your deflect value by 1. Additionally, before an enemy within your melee weapon's reach spends one or more actions to attack one of your allies not in Stonestance, that enemy must spend one additional action.",
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'vigilant_stance' }
            ],
            tier: 1,
            bonuses: [
                { type: BonusType.DEFLECT, target: 'all', value: 1, condition: "while in stonestance" }
            ],
            otherEffects: ["Learn Stonestance (enter as 1 action)", "In stance: +1 deflect", "Enemies in reach must spend +1 action to attack non-Stonestance allies"]
        },
        {
            id: "windstance",
            name: "Windstance",
            description: "When you acquire this talent, you learn a new stance, which you can enter as an action: Windstance. While in this stance, you gain an advantage on Agility tests. Additionally, while there are two or more enemies within your reach, you can use a reaction to gain an action, which you can spend only to Disengage or use an action that includes an attack test targeting one or more of those enemies.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'perception', value: 1 },
                { type: 'talent', target: 'shard_training' }
            ],
            tier: 2,
            bonuses: [],
            grantsAdvantage: ["agility_in_windstance"],
            otherEffects: ["Learn Windstance (enter as 1 action)", "In stance: advantage on Agility", "With 2+ enemies in reach: reaction to gain action (Disengage or attack only)"]
        },
        {
            id: "mighty",
            name: "Mighty",
            description: "When you hit with a weapon or unarmed attack, for each action you used on that attack's action, increase the damage you deal by 1 + your tier.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'stonestance' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["When hitting with weapon/unarmed attack, each action spent increases damage by 1 + tier"]
        },
        {
            id: "bloodstance",
            name: "Bloodstance",
            description: "When you acquire this talent, you learn a new stance, which you can enter as an action: Bloodstance. While in this stance, your Opportunity range for attack tests and physical tests expands by 2, but your Physical, Cognitive, and Spiritual defenses decrease by 2.",
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 2 },
                { type: 'talent', target: 'mighty', operator: 'OR' },
                { type: 'talent', target: 'shard_training', operator: 'OR' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Learn Bloodstance (enter as 1 action)", "In stance: Opportunity range +2 for attack/physical tests", "In stance: -2 to all three defenses"]
        },
        {
            id: "shattering_blow",
            name: "Shattering Blow",
            description: "When you hit a target with a melee attack, if you did so either with a two-handed weapon or with a hand free, you can spend 2 focus to hit with remarkable force. Before resolving that attack's damage, if your target is wearing armor with charges (such as Shardplate), the armor loses 1 charge. After that attack, each target who lost health to your attack is pushed horizontally 5 feet away from you. If your Strength is greater than 5, they're pushed an additional 5 feet for each additional point of Strength. If your target hits a Medium or larger object during this forced movement, the target takes damage as if they'd fallen the distance they were pushed (1d6 impact damage per 10 feet).",
            actionCost: ActionCostCode.Special,
            specialActivation: "When hitting with two-handed weapon or hand free",
            prerequisites: [
                { type: 'skill', target: 'perception', value: 2 },
                { type: 'talent', target: 'windstance' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["When hitting with two-handed/hand free, spend 2 focus", "Before damage: armor loses 1 charge", "After damage: push target 5 feet (+5 per Strength above 5)", "If pushed into object: 1d6 impact per 10 feet pushed"]
        },
        {
            id: "meteoric_leap",
            name: "Meteoric Leap",
            description: "Spend 2 focus to leap up to a quarter of your movement rate, then make an unarmed attack against the Physical defense of each character of your choice within your reach. While wearing Shardplate, you gain an advantage on this test. Roll double the usual damage dice for this attack. On a hit, each target whose Strength score is lower than yours is also knocked Prone.",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'athletics', value: 3 },
                { type: 'talent', target: 'bloodstance' }
            ],
            tier: 4,
            bonuses: [],
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
            },
            otherEffects: ["Spend 2 focus, leap quarter movement rate", "Unarmed attack vs Physical of all chosen targets in reach", "Advantage when wearing Shardplate", "Roll double damage dice", "Hit: targets with lower Strength knocked Prone"]
        },
        {
            id: "precise_parry",
            name: "Precise Parry",
            description: "Before being hit by a melee attack, you can use this reaction and spend 1 focus to attempt to parry the blow. Depending on whether you're unarmed or wielding a weapon, make one of the following tests: Unarmed - Make an Athletics test, gaining a disadvantage unless you're being attacked with a Shardblade. You can spend opportunity to disarm your opponent. Wielding a Weapon - Make a Light Weaponry test or Heavy Weaponry test (using the skill corresponding to your weapon). If you're wielding a Shardblade and if your opponent's weapon is non-Invested, you can spend an action to destroy their weapon. The DC of this test equals the result of the attack test that hit you. On a success, the hit against you becomes a graze.",
            actionCost: ActionCostCode.Reaction,
            prerequisites: [
                { type: 'skill', target: 'perception', value: 3 },
                { type: 'talent', target: 'shattering_blow' }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ["Reaction before being hit, spend 1 focus", "Unarmed: Athletics test (disadvantage unless vs Shardblade), spend opportunity to disarm", "Weapon: Light/Heavy Weaponry test, spend action to destroy non-Invested weapon with Shardblade", "DC = attack result, success turns hit to graze"]
        }
    ],
}
