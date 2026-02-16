import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const TRACKER_TALENT_TREE: TalentTree = {
    pathName: 'Tracker',
    nodes: [
        {
            id: "animal_bond",
            name: "Animal Bond",
            description: "Upgrades an animal companion you've gained as a reward. You can communicate simple concepts with your animal companion. They alert you of danger (+1 to all defenses while within 10 feet). During combat, can use free action to have them act with 1-2 actions immediately (borrowing from their next turn). Animal companion can use Track action (2 actions) to mark target as quarry.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Free action to command animal companion during your turn",
            prerequisites: [
                { type: 'talent', target: 'seek_quarry' }
            ],
            tier: 1,
            bonuses: [
                { type: BonusType.DEFENSE, target: 'physical', value: 1, condition: "while animal companion within 10 feet" },
                { type: BonusType.DEFENSE, target: 'cognitive', value: 1, condition: "while animal companion within 10 feet" },
                { type: BonusType.DEFENSE, target: 'spiritual', value: 1, condition: "while animal companion within 10 feet" }
            ],
            actionGrants: [
                { type: 'free-action', count: 1, restrictedTo: 'Command companion to use 1-2 actions', timing: 'always', frequency: 'unlimited' }
            ],
            otherEffects: ["Requires animal companion reward", "Communicate simple concepts with companion", "Companion moves with you automatically", "Actions given to companion borrowed from next turn", "Companion can Track (2 actions) to mark quarry", "Companion retreats at 0 health instead of becoming Unconscious"]
        },
        {
            id: "deadly_trap",
            name: "Deadly Trap",
            description: "Create and conceal a trap within your reach using foraged supplies or equipment. Choose entangling trap (2d4 impact damage, Immobilized 1 round, difficult terrain) or impaling trap (2d4 keen damage, Afflicted [vital 3+Survival ranks], can spend opportunity for injury). Trap covers 5-foot diameter, triggers when touched. Max traps equal to Survival ranks. Disarm DC equals your Spiritual defense. Gain advantage if target is quarry.",
            actionCost: 2,
            prerequisites: [
                { type: 'skill', target: 'survival', value: 1 },
                { type: 'talent', target: 'seek_quarry' }
            ],
            tier: 1,
            bonuses: [],
            grantsAdvantage: ["setting_trap_vs_quarry"],
            otherEffects: ["Create entangling or impaling trap", "Entangling: 2d4 impact, Immobilized 1 round, difficult terrain", "Impaling: 2d4 keen, Afflicted [vital 3+Survival], opportunity for injury", "5-foot diameter area", "Max active traps = Survival ranks", "Disarm DC = your Spiritual defense"]
        },
        {
            id: "protective_bond",
            name: "Protective Bond",
            description: "Assign your animal companion to protect an ally within 30 feet. Animal companion moves to ally's side. While within reach of that ally, you lose the Animal Bond defense bonus and the ally gains it instead. Ends when you use action within 30 feet of companion or at end of scene.",
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'animal_bond' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Assign companion to protect ally within 30 feet", "Ally gains +1 to all defenses while companion in reach", "You lose Animal Bond defense bonus while active", "End with action if within 30 feet, or at end of scene"]
        },
        {
            id: "experienced_trapper",
            name: "Experienced Trapper",
            description: "Forage during short rest without using full attention (can roll recovery die). Auto-succeed on Survival tests to forage for food/water (sustains Survival ranks number of characters). After long rest in wilderness, can fashion survival tool using Survival instead of Crafting. Deadly Trap damage increases to 2d6 and conditions last 2 rounds.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Various automatic benefits when foraging and resting",
            prerequisites: [
                { type: 'skill', target: 'perception', value: 2 },
                { type: 'talent', target: 'deadly_trap' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Forage during short rest without losing recovery die", "Auto-succeed foraging for food/water (sustains Survival rank characters)", "Fashion tool after long rest using Survival", "Deadly Trap: 2d4→2d6 damage, 1→2 round conditions"]
        },
        {
            id: "feral_connection",
            name: "Feral Connection",
            description: "Animal companion's max and current health increase by 5 × your tier (scales with tier increases). Companion's Physical, Cognitive, and Spiritual defenses increase by 2 each. Companion adds your Survival ranks as bonus to their tests. Gain Animal Care utility expertise.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'survival', value: 2 },
                { type: 'talent', target: 'protective_bond' }
            ],
            tier: 3,
            bonuses: [],
            expertiseGrants: [
                { type: 'fixed', expertises: ['Animal Care'] }
            ],
            otherEffects: ["Companion gains 5×tier max health (scales with tier)", "Companion gains +2 to all three defenses", "Companion adds Survival ranks to tests"]
        },
        {
            id: "hunter_edge",
            name: "Hunter's Edge",
            description: "Your animal companion gains an advantage on tests against your quarry. Deadly Trap damage increases to 2d8 and conditions last 3 rounds.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'survival', value: 3 },
                { type: 'talent', target: 'experienced_trapper' }
            ],
            tier: 4,
            bonuses: [],
            grantsAdvantage: ["companion_tests_vs_quarry"],
            otherEffects: ["Deadly Trap: 2d6→2d8 damage, 2→3 round conditions"]
        },
        {
            id: "pack_hunting",
            name: "Pack Hunting",
            description: "When an ally in your line of effect attacks your quarry, you can use this reaction and spend 1 focus to add your ranks in Survival to either the result of their attack test or their damage roll (your choice).",
            actionCost: ActionCostCode.Reaction,
            prerequisites: [
                { type: 'skill', target: 'perception', value: 3 },
                { type: 'talent', target: 'protective_bond' }
            ],
            tier: 4,
            bonuses: [],
            resourceTriggers: [
                { resource: 'focus', effect: 'spend', amount: 1, trigger: 'when ally attacks your quarry' }
            ],
            otherEffects: ["Add Survival ranks to ally's attack roll or damage (your choice)"]
        },
        {
            id: "surefooted",
            name: "Surefooted",
            description: "Increase your movement rate by 10. Before taking damage from dangerous terrain or falling, reduce that damage by 2 × your tier.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'experienced_trapper' }
            ],
            tier: 3,
            bonuses: [
                { type: BonusType.DERIVED, target: 'movement', value: 10 },
                { type: BonusType.DEFENSE, target: 'terrain_damage_reduction', formula: '2 * tier' }
            ]
        }
    ],
}