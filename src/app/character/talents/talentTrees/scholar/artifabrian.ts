import { TalentTree, ActionCostCode } from "../../talentInterface";
import { BonusType } from "../../../bonuses/bonusModule";

export const ARTIFABRIAN_TALENT_TREE: TalentTree = {
    pathName: 'Artifabrian',
    nodes: [
        {
            id: "efficient_engineer",
            name: "Efficient Engineer",
            description: "When you acquire this talent, gain a utility expertise in Armor Crafting, Equipment Crafting, or Weapon Crafting. You also gain one of the following: an amplifying painrial, a numbing painrial, or a pair of spanreeds plus an emotion bracelet. Additionally, when you attempt to craft an item or invent a fabrial, your Opportunity range on those tests expands by 2, and any cost to acquire raw materials is reduced by half.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'crafting', value: 1 },
                { type: 'talent', target: 'education' }
            ],
            tier: 1,
            bonuses: [
                { type: BonusType.SKILL, target: 'crafting', value: 2, condition: 'Opportunity range expansion' }
            ],
            expertiseGrants: [
                { type: 'choice', expertises: ['Armor Crafting', 'Equipment Crafting', 'Weapon Crafting'] }
            ],
            otherEffects: ["Gain amplifying painrial, numbing painrial, or spanreeds+emotion bracelet", "Material costs halved"]
        },
        {
            id: "prized_acquisition",
            name: "Prized Acquisition",
            description: "When you acquire this talent, you gain a specialist expertise in Fabrial Crafting. Additionally, you gain a specially cut gemstone and can use it to craft a fabrial. The first time you attempt to craft a fabrial with this gem, you ignore the usual time requirements for attracting a spren and crafting the fabrial, though you still need raw materials. This gem fulfills the gem requirement for a unique fabrial with a tier equal to your current character tier. If you lose it, you can usually find an appropriate replacement after a long rest. During downtime, you can salvage your fabrial to recover this gem.",
            actionCost: ActionCostCode.Special,
            specialActivation: "First fabrial crafting with gem ignores time requirements",
            prerequisites: [
                { type: 'talent', target: 'education' }
            ],
            tier: 1,
            bonuses: [],
            expertiseGrants: [
                { type: 'fixed', expertises: ['Fabrial Crafting'] }
            ],
            otherEffects: ["Gain gemstone for unique fabrial (tier = character tier)", "Can salvage fabrial to recover gem", "Can replace lost gem after long rest"]
        },
        {
            id: "deep_study",
            name: "Deep Study",
            description: "When you acquire this talent, your Erudition talent grants you one additional cultural or utility expertise, and it grants you two additional cognitive skills that aren't surge skills. You can reassign these in the same way as the others you gained from that talent.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'efficient_engineer' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["Erudition grants +1 cultural or utility expertise", "Erudition grants +2 cognitive skills (non-surge)", "Can reassign like other Erudition benefits"]
        },
        {
            id: "fine_handiwork",
            name: "Fine Handiwork",
            description: "When you craft an item or invent a fabrial, you can spend one upgrade to apply an advanced feature, instead of spending two upgrades. You can only benefit from this talent once per item.",
            actionCost: ActionCostCode.Special,
            specialActivation: "When crafting item or inventing fabrial",
            prerequisites: [
                { type: 'talent', target: 'efficient_engineer' }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: ["Apply advanced feature for 1 upgrade instead of 2 (once per item)"]
        },
        {
            id: "inventive_design",
            name: "Inventive Design",
            description: "When you craft a fabrial using your gemstone from your Prized Acquisition, you can select an effect of 1 tier higher than the tier you're currently crafting.",
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'crafting', value: 2 },
                { type: 'talent', target: 'prized_acquisition' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ["When crafting fabrial with Prized Acquisition gem, can select effect 1 tier higher"]
        },
        {
            id: "overcharge",
            name: "Overcharge",
            description: "Once per turn, when you make an attack test using a fabrial, you can raise the stakes. You can spend opportunity from this test to use the Strike action with that fabrial as a free action on the same turn; that Strike doesn't count against your allowed number of Strikes for the hands holding that weapon. The GM can spend opportunity from this test to add one new drawback to that fabrial. This drawback remains until you resolve the unexpected issue by succeeding on a DC 15 Crafting test made as a reaction.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Once per turn when making attack test using fabrial",
            prerequisites: [
                { type: 'skill', target: 'crafting', value: 3 },
                { type: 'talent', target: 'prized_acquisition' }
            ],
            tier: 3,
            bonuses: [],
            actionGrants: [
                { type: 'free-action', count: 1, restrictedTo: 'Strike with fabrial', frequency: 'once-per-round' }
            ],
            otherEffects: ["Raise stakes on fabrial attack", "GM can add drawback until DC 15 Crafting test resolves it"]
        },
        {
            id: "experimental_tinkering",
            name: "Experimental Tinkering",
            description: "When you craft an item or invent a fabrial, your Opportunity range on those tests expands by 1, and your crafting time is halved. Additionally, you can forgo the usual benefits of a long rest to instead spend that time tinkering with a fabrial that uses your Prized Acquisition gem. After that long rest, you can attempt to reconfigure this fabrial to create a different fabrial of the same tier or lower; this follows the normal crafting process, except you don't need new materials and you ignore the usual time requirement for attracting a spren and crafting the fabrial. If you fail your Lore test to trap a spren, your previous fabrial remains intact, but you can't use this talent to reconfigure a fabrial again until your next long rest. After you finish crafting a new fabrial using this talent, the old fabrial is lost.",
            actionCost: ActionCostCode.Special,
            specialActivation: "Can reconfigure fabrial during long rest",
            prerequisites: [
                { type: 'talent', target: 'fine_handiwork' }
            ],
            tier: 4,
            bonuses: [
                { type: BonusType.SKILL, target: 'crafting', value: 1, condition: 'Opportunity range expansion' }
            ],
            otherEffects: ["Crafting time halved", "Forgo long rest to reconfigure Prized Acquisition fabrial", "Reconfiguration: no materials needed, no time requirement, same tier or lower", "Failed spren trap: old fabrial intact, can't reconfigure until next long rest", "Success: old fabrial lost"]
        },
        {
            id: "overwhelm_with_detail",
            name: "Overwhelm With Detail",
            description: "Spend 2 focus to make a cognitive or spiritual test using your Lore modifier instead of the usual skill modifier for that test.",
            actionCost: ActionCostCode.Special,
            specialActivation: "When making cognitive or spiritual test",
            prerequisites: [
                { type: 'skill', target: 'lore', value: 3 },
                { type: 'talent', target: 'experimental_tinkering' }
            ],
            tier: 4,
            bonuses: [],
            resourceTriggers: [
                { resource: 'focus', effect: 'spend', amount: 2, trigger: 'when making cognitive or spiritual test', frequency: 'unlimited' }
            ],
            otherEffects: ["Use Lore modifier for cognitive or spiritual test instead of usual skill"]
        }
    ],
}
