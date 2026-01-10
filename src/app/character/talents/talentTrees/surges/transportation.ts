import { TalentTree, ActionCostCode } from "../../talentInterface";

export const TRANSPORTATION_SURGE_TREE: TalentTree = {
    pathName: "Transportation",
    nodes: [
        {
            id: 'transportation_base',
            name: 'Transportation',
            description: 'Spend 1 Investiture or more to look into the Cognitive Realm where it corresponds to your current location. This allows you to see the true nature of many things around you. For each Investiture you spend, you can use one of these effects within your spren bond range: Learn Emotions and Motives - You can observe what types of spren gather around people, helping you discern their true emotions or motives. This might grant you one or more advantages on a test to influence them, or you might learn their motive without an Insight test. Locate Characters - By watching the flames of other people and learning how to identify them, you can make a guess at their location in the Physical Realm (if they\'re close enough for you to spot their flame in Shadesmar). Sense Investiture - Objects and people Invested with Stormlight or other Investiture can be seen in the Cognitive Realm, revealing their true nature. This might be a Fused, another Radiant, or an object like a Shardblade or a fabrial. Spotting and identifying some of these things can be difficult, and at the GM\'s discretion, you might need to succeed on a Transportation test to do so.',
            actionCost: 1,
            prerequisites: [
                { type: 'skill', target: 'TRANSPORTATION', value: 1 }
            ],
            tier: 0,
            bonuses: [],
            otherEffects: [
                'Spend 1+ Investiture to peer into Cognitive Realm',
                'Per Investiture: Learn emotions/motives, locate characters, or sense Investiture',
                'Effects work within spren bond range'
            ]
        },
        {
            id: 'transportation_cognitive_farsight',
            name: 'Cognitive Farsight',
            description: 'You can see greater distances into Shadesmar, and you can use it to orient yourself. When you peer into the Cognitive Realm with Transportation, you can spot things up to a distance equal to 3 × your spren bond range. Additionally, while you have 1 Investiture or more, you always know both which direction is north and which direction you must travel to reach the nearest settlement or gathering of people.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'skill', target: 'TRANSPORTATION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'See into Cognitive Realm up to 3 × spren bond range',
                'With 1+ Investiture, always know north and direction to nearest settlement'
            ]
        },
        {
            id: 'transportation_realmic_evasion',
            name: 'Realmic Evasion',
            description: 'You dodge danger, momentarily transporting yourself between the Physical and Cognitive Realms, then return after the danger has passed. Before you\'re hit by an attack, you can use this reaction and spend 1 Investiture to make a Transportation test. The DC of this test equals the triggering attack\'s test result; you can choose whether to use this reaction after you learn the DC. On a failure, the attack grazes instead of hitting. On a success, the attack instead misses and can\'t graze.',
            actionCost: ActionCostCode.Reaction,
            prerequisites: [
                { type: 'ideal', target: 'second', value: 1 },
                { type: 'skill', target: 'TRANSPORTATION', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'React before hit to spend 1 Investiture',
                'Transportation test vs attack result',
                'Failure: attack grazes instead of hitting',
                'Success: attack misses and can\'t graze'
            ]
        },
        {
            id: 'transportation_cognitive_vision',
            name: 'Cognitive Vision',
            description: 'You can glean even greater knowledge and spot even more hidden information when you peer into the Cognitive Realm. The following entries are added to the list of things you can spot when you use Transportation to look into the Cognitive Realm: Learn Intent: Make a Transportation test as Free against the Cognitive defense of an enemy you can sense. On a success, you extrapolate their likely intentions based on the spren lurking around them, and you can share that information with your allies. That enemy gains a disadvantage on their next test against you or one of your allies. Locate Objects: By briefly reaching into Shadesmar, you can examine the various soul beads and their relative locations in the bead ocean. This might reveal nearby objects or other information about your immediate environment, depending on which beads you touch. As usual, spotting more difficult things might require a Transportation test at the GM\'s discretion.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'transportation_cognitive_farsight' },
                { type: 'skill', target: 'TRANSPORTATION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'Learn Intent: Transportation test as Free vs Cognitive defense for enemy disadvantage',
                'Locate Objects: Examine soul beads to reveal nearby objects'
            ]
        },
        {
            id: 'transportation_realmic_step',
            name: 'Realmic Step',
            description: 'You briefly slip into the Cognitive Realm, run a short distance there, then reappear in the Physical Realm. Make a DC 15 Transportation test. On a success, spend 2 Investiture to move through Shadesmar (along with each object you\'re wearing or carrying), transporting yourself to an unoccupied space you can sense within your spren bond range. This movement doesn\'t trigger Reactive Strikes. If you are on or above a large body of water, using this talent only costs 1 Investiture, as you don\'t have to shape the sea of beads beneath yourself to move around.',
            actionCost: 1,
            prerequisites: [
                { type: 'talent', target: 'transportation_realmic_evasion' },
                { type: 'skill', target: 'TRANSPORTATION', value: 2 }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'DC 15 Transportation test to teleport within spren bond range',
                'Costs 2 Investiture (1 if on/above large body of water)',
                'Movement doesn\'t trigger Reactive Strikes'
            ]
        },
        {
            id: 'transportation_elsecalling',
            name: 'Elsecalling',
            description: 'You temporarily open a miniature perpendicularity that allows you to travel between the Cognitive and Physical Realms. You can transport yourself from the Physical Realm to the same location within the Cognitive Realm, or vice versa, along with each object you\'re wearing or carrying. This movement doesn\'t trigger Reactive Strikes. If you\'re in the Physical Realm, spend 1 Investiture to transport yourself to the Cognitive Realm. Elsecalling in this way is simple, requiring no skill test. If you\'re in the Cognitive Realm, make a DC 20 Transportation test. On a success, spend 2 Investiture to transport yourself to the Physical Realm. On a failure, you don\'t spend Investiture or transport yourself; on a later turn, you can attempt to Elsecall again.',
            actionCost: 2,
            prerequisites: [
                { type: 'ideal', target: 'third', value: 1 },
                { type: 'talent', target: 'transportation_realmic_step' },
                { type: 'skill', target: 'TRANSPORTATION', value: 3 }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: [
                'Physical → Cognitive: spend 1 Investiture (no test)',
                'Cognitive → Physical: DC 20 test, spend 2 Investiture',
                'Movement doesn\'t trigger Reactive Strikes'
            ]
        },
        {
            id: 'transportation_shared_transportation',
            name: 'Shared Transportation',
            description: 'You can keep your miniature perpendicularities open long enough to bring others along. When you move yourself through Shadesmar with your Elsecalling or Realmic Step talent, you can spend additional Investiture to also transport willing characters within your reach, along with everything they\'re wearing or carrying. Spend 1 Investiture per additional character you choose to transport.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'When using Elsecalling or Realmic Step',
            prerequisites: [
                { type: 'talent', target: 'transportation_elsecalling' },
                { type: 'skill', target: 'TRANSPORTATION', value: 4 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'Transport willing allies within reach with Elsecalling or Realmic Step',
                'Costs +1 Investiture per additional character'
            ]
        },
        {
            id: 'transportation_elsegate',
            name: 'Elsegate',
            description: 'You can create more stable perpendicularities that allow you to transport yourself and others to highly Invested locations, even across a significant distance. After a long rest, you can instantly transport yourself and up to ten more willing characters, along with each object the targets are wearing or carrying. Choose an Oathgate platform or permanent perpendicularity you\'ve visited before. After spending Investiture as described below, you and the other targets are transported to that destination. This Transportation requires significant Investiture; you must have infused spheres worth twice as many marks as the number of characters you\'re transporting, and when you arrive, those spheres all become dun. At the GM\'s discretion, you might be able to choose other destinations that are highly Invested locations you\'ve visited before.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'After a long rest',
            prerequisites: [
                { type: 'ideal', target: 'fourth', value: 1 },
                { type: 'talent', target: 'transportation_shared_transportation' },
                { type: 'skill', target: 'TRANSPORTATION', value: 4 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'Transport up to 10 willing characters to visited Oathgate/perpendicularity',
                'Requires spheres worth 2× marks per character (become dun on arrival)',
                'Can only use after long rest'
            ]
        },
        {
            id: 'transportation_realmwalker',
            name: 'Realmwalker',
            description: 'You effortlessly step between the Cognitive and Physical Realms. When you make a Transportation test to use a Transportation talent, you automatically succeed.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'transportation_elsecalling' },
                { type: 'skill', target: 'TRANSPORTATION', value: 4 }
            ],
            tier: 4,
            bonuses: [],
            otherEffects: ['Automatically succeed on Transportation tests for Transportation talents']
        }
    ]
};
