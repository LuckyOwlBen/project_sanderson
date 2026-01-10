import { TalentTree, ActionCostCode } from "../../talentInterface";

export const ILLUMINATION_SURGE_TREE: TalentTree = {
    pathName: "Illumination",
    nodes: [
        {
            id: 'illumination_base',
            name: 'Illumination (Lightweaving)',
            description: 'To Lightweave an illusion, spend 1 Investiture or more to infuse it into thin air in a space within your spren bond range. This illusion can\'t exceed the surge size for your ranks in Illumination. Lightweavings typically take the form of a three-dimensional hologram representing a character, object, or phenomenon you\'re familiar with. This illusion is composed of light, complete with animation and accompanying sounds produced by the vibrations of your bonded spren. Simple and Complex Illusions: If the illusion depicts a simple object with no sound or animations, the infusion uses 1 Investiture every 10 minutes. If the illusion depicts a character or more complex object, it instead uses 1 Investiture each round. For the duration, the illusion remains active even if you move out of range. You can move and control a complex illusion. Disguising Yourself: Alternatively, if you have 1 Investiture or more, you can use Illumination to create an illusory disguise on yourself without spending Investiture. This disguise lasts until you end it as Free or run out of Investiture. Deceiving Characters: Simple objects or self-disguises automatically convince characters unless they\'re suspicious. Complex illusions may require an Illumination test vs Cognitive defense. Characters can scrutinize illusions with opposed Perception test; if they exceed your Illumination test, they detect the illusion.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'ILLUMINATION', value: 1 }
            ],
            tier: 0,
            bonuses: [],
            otherEffects: [
                'Create illusions within spren bond range',
                'Simple illusions: 1 Investiture per 10 minutes',
                'Complex illusions: 1 Investiture per round',
                'Self-disguise: Free with 1+ Investiture (no cost)',
                'Illusion tests vs Cognitive defense or opposed Perception'
            ]
        },
        {
            id: 'illumination_distracting_illusion',
            name: 'Distracting Illusion',
            description: 'You create a moving, illusory copy of someone to distract your enemies. Spend 1 Investiture to Lightweave an illusory duplicate, either of yourself or an ally you can sense within your spren bond range. The illusion appears in that character\'s space and moves with them. Attacks against that character gain a disadvantage and can\'t graze. The illusion ends after an attack misses that character or at the end of the scene.',
            actionCost: 1,
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'skill', target: 'ILLUMINATION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Spend 1 Investiture to create illusory duplicate of self or ally',
                'Attacks against target gain disadvantage and can\'t graze',
                'Ends after attack misses or at end of scene'
            ]
        },
        {
            id: 'illumination_lingering_lightweaving',
            name: 'Lingering Lightweaving',
            description: 'You infuse spheres with your Illumination, creating illusions that linger long after you\'ve moved away. When you Lightweave an illusion, instead of creating it in thin air, you can instead infuse its Investiture in a sphere or unencased gem within 5 feet of that illusion. For the duration, the illusion moves with the gem; for example, an ally could carry this gem to extend the duration of an illusory disguise you created for them. Instead of the infusion expending 1 Investiture per round, it expends 1 Investiture per number of rounds equal to your ranks in Illumination; for example, if you have 3 ranks in Illumination, your infusions in spheres expend Investiture once every 3 rounds.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'When you Lightweave an illusion',
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'skill', target: 'ILLUMINATION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Infuse illusion into sphere/gem within 5 feet',
                'Illusion moves with the gem',
                'Expends 1 Investiture per X rounds (X = Illumination ranks)'
            ]
        },
        {
            id: 'illumination_disorienting_flash',
            name: 'Disorienting Flash',
            description: 'You create a brief burst of light and sound that attacks the senses of targets near you. Spend 1 Investiture to project a burst of light in an area within your reach, up to the size you can create with your ranks in Illumination. Make one Illumination test and compare the result against the Cognitive defense of each character in that area. If you succeed against a target, they become Disoriented until the end of their next turn.',
            actionCost: 2,
            prerequisites: [
                { type: 'talent', target: 'illumination_distracting_illusion' },
                { type: 'skill', target: 'ILLUMINATION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'Spend 1 Investiture for burst of light in area',
                'Illumination test vs Cognitive defense',
                'Success: targets become Disoriented until end of their next turn'
            ]
        },
        {
            id: 'illumination_stormlight_reclamation',
            name: 'Stormlight Reclamation',
            description: 'You can reclaim Stormlight from active illusions. After your infusions expend their infused Investiture at the start of your turn, you can end any number of those infusions within your reach, recovering all remaining Investiture they were infused with.',
            actionCost: ActionCostCode.Free,
            prerequisites: [
                { type: 'talent', target: 'illumination_distracting_illusion' },
                { type: 'skill', target: 'ILLUMINATION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: ['Recover Investiture from infusions within reach']
        },
        {
            id: 'illumination_spiritual_illumination',
            name: 'Spiritual Illumination',
            description: 'You use Lightweaving to show your allies inspiring possibilities of who they could become. Spend 2 Investiture to create a momentary Lightweaving near an ally you can sense within your spren bond range. That ally becomes Determined and Focused until the end of their next turn.',
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'illumination_disorienting_flash' },
                { type: 'skill', target: 'ILLUMINATION', value: 3 }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: [
                'Spend 2 Investiture to inspire ally within spren bond range',
                'Ally becomes Determined and Focused until end of their next turn'
            ]
        },
        {
            id: 'illumination_multiplicative_lightweaving',
            name: 'Multiplicative Lightweaving',
            description: 'You effortlessly Lightweave multiple illusions at once. When you Lightweave an illusion, you can create a number of additional illusions up to your ranks in Illumination. These infusions last for the duration of the original infusion and require no additional Investiture to create or maintain.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'illumination_stormlight_reclamation' },
                { type: 'skill', target: 'ILLUMINATION', value: 3 }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: [
                'Create up to X additional illusions (X = Illumination ranks)',
                'No additional Investiture to create or maintain'
            ]
        },
        {
            id: 'illumination_painful_truth',
            name: 'Painful Truth',
            description: 'You create a haunting image of who an enemy could have been if they\'d taken a better path. Spend 2 Investiture and make an Illumination test against the Spiritual defense of a target you can sense within your spren bond range. On a success, they stumble in shock, becoming Slowed until the end of their next turn. At the start of the target\'s next turn, they must either spend focus equal to your ranks in Illumination to end this effect as Free, or immediately use the Move action to move as far as possible away from you.',
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'illumination_spiritual_illumination' },
                { type: 'skill', target: 'ILLUMINATION', value: 4 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'Spend 2 Investiture, test vs Spiritual defense',
                'Success: target becomes Slowed until end of their next turn',
                'Target must spend X focus as Free or Move away (X = Illumination ranks)'
            ]
        },
        {
            id: 'illumination_endless_illusions',
            name: 'Endless Illusions',
            description: 'You\'ve become so efficient at powering your illusions that you can maintain them indefinitely. While you have 1 Investiture or more, each of your Illumination infusions within your spren bond range expends no infused Investiture at the start of your turn.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'skill', target: 'ILLUMINATION', value: 4 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'With 1+ Investiture, illusions within spren bond range don\'t expend Investiture'
            ]
        }
    ]
};
