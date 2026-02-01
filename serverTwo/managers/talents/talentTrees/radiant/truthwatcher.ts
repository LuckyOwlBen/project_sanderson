import { TalentPath, TalentTree, ActionCostCode } from "../../talentInterface";

const MISTSPREN_BOND_TREE: TalentTree = {
    pathName: "Mistspren Bond",
    nodes: [
        {
            id: 'truthwatcher_key_talent',
            name: 'First Ideal (Truthwatcher Key)',
            description: 'You begin bonding a mistspren, allowing you to breathe in and use Stormlight. You might be aware of this nascent bond, or you might use the powers subconsciously until you get closer to speaking the First Ideal. When you acquire this talent, you gain access to Investiture, beginning with a maximum Investiture of 2 + your Awareness or Presence (whichever is higher). You can now use the Breathe Stormlight, Enhance, and Regenerate actions. Additionally, you gain the goal "Speak the First Ideal." After you complete this goal, you gain the following reward: You become Empowered until the end of that scene. You gain the Illumination and Progression surges. You gain an additional skill on your character sheet for the above surges, starting with 1 rank in each.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'When bonding a mistspren at level 2+',
            prerequisites: [{ type: 'level', target: 'character', value: 2 }],
            tier: 0,
            bonuses: [],
            otherEffects: [
                'Grants Investiture resource (max = 2 + higher of Awareness or Presence)',
                'Unlocks Breathe Stormlight, Enhance, and Regenerate actions',
                'Grants goal: Speak the First Ideal',
                'Reward: Become Empowered until end of scene',
                'Reward: Gain Illumination and Progression surge skills at rank 1',
                'Reward: Grants access to Illumination and Progression surge trees'
            ]
        },
        {
            id: 'truthwatcher_spiritual_healing',
            name: 'Spiritual Healing',
            description: 'You mix Illumination and Regrowth to skillfully repair the mind and soul. Before you restore health to yourself or a willing ally, you can spend 2 Investiture to instead cause the target to recover half as much focus (rounded up) as they would have recovered health.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'Before you restore health to yourself or ally',
            prerequisites: [
                { type: 'skill', target: 'ILLUMINATION', value: 2 },
                { type: 'skill', target: 'PROGRESSION', value: 2 },
                { type: 'ideal', target: 'first', value: 1 }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Spend 2 Investiture to convert health restoration to focus restoration',
                'Focus recovered = half the health that would have been restored (rounded up)'
            ]
        },
        {
            id: 'truthwatcher_invested',
            name: 'Invested',
            description: 'You learn to hold and wield greater quantities of Stormlight within yourself. When you acquire this talent, your maximum Investiture increases by a number equal to your tier. When your tier increases by 1, your maximum Investiture does as well.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [{ type: 'talent', target: 'truthwatcher_spiritual_healing' }],
            tier: 2,
            bonuses: [],
            otherEffects: ['Increases max Investiture by tier value permanently']
        },
        {
            id: 'truthwatcher_second_ideal',
            name: 'Second Ideal (Truthwatcher)',
            description: 'You seek to deepen your Nahel bond with your mistspren by speaking the Second Ideal. You gain the goal "Speak the Second Ideal." After you complete this goal, you gain the following reward: You become Empowered until the end of that scene. Your Enhance action becomes more powerful. While you have 1 Investiture or more, you can use Enhance as a free action, and you don\'t need to spend Investiture to use this action or maintain its effect.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'Upon acquiring this talent',
            prerequisites: [
                { type: 'level', target: 'character', value: 4 },
                { type: 'ideal', target: 'first', value: 1 }
            ],
            tier: 3,
            bonuses: [],
            otherEffects: [
                'Grants goal: Speak the Second Ideal',
                'Reward: Become Empowered until end of scene',
                'Reward: Enhance becomes free action while having 1+ Investiture',
                'Reward: Enhance no longer costs Investiture to use or maintain'
            ]
        },
        {
            id: 'truthwatcher_wound_regeneration',
            name: 'Wound Regeneration',
            description: 'You can use Stormlight to rapidly recover from injuries. When you use the Regenerate free action, you can spend Investiture to instantly recover from an injury of your choice (either instead of or in addition to healing yourself). Spend 2 Investiture to recover from a temporary injury, or spend 3 Investiture to recover from a permanent one.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'When you use the Regenerate action',
            prerequisites: [{ type: 'talent', target: 'truthwatcher_invested' }],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'Can heal temporary injury for 2 Investiture',
                'Can heal permanent injury for 3 Investiture'
            ]
        },
        {
            id: 'truthwatcher_third_ideal',
            name: 'Third Ideal (Truthwatcher)',
            description: 'You seek to advance your Nahel bond even further by speaking the Third Ideal. You gain the goal "Speak the Third Ideal." After you complete this goal, you gain the following reward: You become Empowered until the end of that scene. You can summon your spren as a Radiant Shardblade (see chapter 7).',
            actionCost: ActionCostCode.Special,
            specialActivation: 'Upon acquiring this talent',
            prerequisites: [
                { type: 'level', target: 'character', value: 8 },
                { type: 'ideal', target: 'second', value: 2 }
            ],
            tier: 5,
            bonuses: [],
            otherEffects: [
                'Grants goal: Speak the Third Ideal',
                'Reward: Become Empowered until end of scene',
                'Reward: Can summon Radiant Shardblade'
            ]
        },
        {
            id: 'truthwatcher_deepened_bond',
            name: 'Deepened Bond',
            description: 'The strength of your Nahel bond now allows your spren to manifest more fully in the Physical Realm. Your spren bond range increases from 30 feet to 100 feet. Additionally, when you spend focus to give your spren a task, it costs you 1 fewer focus (to a minimum cost of 1).',
            actionCost: ActionCostCode.Passive,
            prerequisites: [{ type: 'ideal', target: 'third', value: 3 }],
            tier: 6,
            bonuses: [],
            otherEffects: [
                'Spren bond range increases to 100 feet',
                'Spren tasks cost 1 fewer focus (minimum 1)'
            ]
        },
        {
            id: 'truthwatcher_take_squire',
            name: 'Take Squire (Truthwatcher)',
            description: 'You begin taking other people under your wing, allowing them to breathe Stormlight and use surges before they\'ve established their own Nahel bond. After a long rest, choose a companion or player character you can influence to take as your squire. To choose them, they must be willing and sapient, you must have known them for at least 1 game session, and they must not have bonded a Radiant spren. When you choose a squire, decide whether you want to grant them both of your surges, one of them, or none. That character becomes your squire, gaining the surges you chose plus the other benefits in the "Squires" section earlier in this chapter. You can have a maximum number of squires up to your current Ideal (such as three for the Third Ideal). If you already have the maximum number of squires, you must choose one to dismiss as your squire before choosing a new one.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'After a long rest',
            prerequisites: [{ type: 'ideal', target: 'third', value: 3 }],
            tier: 6,
            bonuses: [],
            otherEffects: [
                'Can choose willing, sapient, non-Radiant character as squire',
                'Must have known them for at least 1 session',
                'Grant 0, 1, or both surges to squire',
                'Max squires equals current Ideal level'
            ]
        },
        {
            id: 'truthwatcher_fourth_ideal',
            name: 'Fourth Ideal (Truthwatcher)',
            description: 'You seek to become a full Knight Radiant by speaking the Fourth Ideal. You gain the goal "Speak the Fourth Ideal." After you complete this goal, you gain the following reward: You become Empowered until the end of that scene. You can call a swarm of concentrationspren as Radiant Shardplate (see chapter 7).',
            actionCost: ActionCostCode.Special,
            specialActivation: 'Upon acquiring this talent',
            prerequisites: [
                { type: 'level', target: 'character', value: 13 },
                { type: 'ideal', target: 'third', value: 3 }
            ],
            tier: 7,
            bonuses: [],
            otherEffects: [
                'Grants goal: Speak the Fourth Ideal',
                'Reward: Become Empowered until end of scene',
                'Reward: Can summon Radiant Shardplate'
            ]
        }
    ]
};

const FUTURE_SIGHT_TREE: TalentTree = {
    pathName: "Future Sight",
    nodes: [
        {
            id: 'enlightened_future_sight',
            name: 'Future Sight (Enlightened Key)',
            description: 'As a Truthwatcher bonded to an Enlightened mistspren, you have enigmatic visions of the future, which are initially outside your control. After a short or long rest or at the start of any scene, you can ask the GM for a vision of the future. If the GM deems an event in the near future to be important enough to trigger a vision, you have a vision. Most concern events within the next day, but events with wider-reaching implications might be seen earlier than that. At the GM\'s discretion, they can have you make a Deduction test to determine how much you can see and understand; depending on the result, the GM might tell you what the vision reveals about upcoming events, or they might simply describe a jumbled vision with confusing glimpses that don\'t grant useful information. The GM can spend C from this test to secretly and randomly determine whether to give you true or false information. After you complete your goal to "Speak the First Ideal," you gain access to the later talents on this talent tree.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'After short/long rest or at start of scene',
            prerequisites: [],
            tier: 0,
            bonuses: [],
            otherEffects: [
                'Granted free when bonding an Enlightened mistspren',
                'Can request visions from GM',
                'May require Deduction test to interpret vision',
                'GM can use complications to give false information',
                'Unlocks remaining Future Sight talents after speaking First Ideal'
            ]
        },
        {
            id: 'enlightened_glimpse_future',
            name: 'Glimpse the Future',
            description: 'You have vague visions of future possibilities, giving you some sway to divert your Fortune. Once per round after you roll the dice for a test, you can spend 1 Investiture or more to reroll that many of the test\'s dice. The original rolls have no effect and you must use the new result.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'Once per round after rolling dice for a test',
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'talent', target: 'enlightened_future_sight' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Spend X Investiture to reroll X dice from a test (once per round)',
                'Must use new result'
            ]
        },
        {
            id: 'enlightened_search_past',
            name: 'Search the Past',
            description: 'You can attempt to direct your visions to see past events; the further back you look, the harder they are to glimpse. After a long rest, you can choose one past event you\'ve either heard about or experienced, then make a Lore test. The DC is determined by how long ago the event took place: 1 day (DC 10), 10 days (DC 13), 50 days (DC 16), 1 year (DC 19), 10 years (DC 22), 100 years (DC 25), 1,000 years (DC 30), 10,000 years (DC 35). This DC is reduced by 10 if you\'ve experienced the event before, whether in person or through a vision. On a successful test, you experience a vision of 10 minutes of the event as though you were there. If the event is one you\'ve experienced before, you can choose to appear in a specific different location or time within that event. You are a passive observer in the vision, invisible, intangible, and otherwise unable to alter the course of the event in any way.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'After a long rest',
            prerequisites: [
                { type: 'ideal', target: 'first', value: 1 },
                { type: 'talent', target: 'enlightened_future_sight' }
            ],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Make Lore test to view 10 minutes of past event',
                'DC based on time since event (DC 10 for 1 day, up to DC 35 for 10,000 years)',
                'DC reduced by 10 if you experienced the event before',
                'You are invisible, intangible observer in vision'
            ]
        },
        {
            id: 'enlightened_vision_void',
            name: 'Vision Void',
            description: 'Thanks to your ability to see the future and change its course, you and your nearby allies create a black spot in the future sight of others. You and each ally within your spren bond range are immune to any enemy effect that would reroll or replace the result of any die rolled by you or those allies. Additionally, if you\'re present in or strongly influencing an event, no enemy can ever see visions of that event, whether they\'re viewing it as a future event or a past one.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [
                { type: 'talent', target: 'enlightened_glimpse_future', operator: 'OR' },
                { type: 'talent', target: 'enlightened_search_past', operator: 'OR' }
            ],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'You and allies within spren bond range immune to enemy die reroll/replacement effects',
                'Enemies cannot see visions of events you are present in or strongly influencing'
            ]
        },
        {
            id: 'enlightened_alter_fortune',
            name: 'Alter Fortune',
            description: 'You use your glimpses of possibilities to control the outcome of events. Each time you finish a long rest, roll a number of d20s equal to 1 + your tier, and record each result. When an enemy or willing ally you can sense makes a test, you can use a reaction to replace the test\'s d20 roll with one of your recorded numbers. You can replace that number after you see their die roll and after they apply any advantages, but you must do so before the effects of the test are resolved. You lose a recorded number after you use it to replace a d20 roll or after a long rest.',
            actionCost: ActionCostCode.Reaction,
            prerequisites: [{ type: 'talent', target: 'enlightened_glimpse_future' }],
            tier: 2,
            bonuses: [],
            otherEffects: [
                'Roll (1 + tier) d20s after each long rest and record results',
                'Use reaction to replace enemy or willing ally test with recorded d20',
                'Can replace after seeing their roll and advantages applied',
                'Lose recorded number after use or after long rest'
            ]
        }
    ]
};

export const TRUTHWATCHER_TALENT_TREE: TalentPath = {
    name: "Truthwatcher",
    paths: [MISTSPREN_BOND_TREE],
    talentNodes: []
};

export const ENLIGHTENED_TRUTHWATCHER_TALENT_TREE: TalentPath = {
    name: "Enlightened Truthwatcher",
    paths: [MISTSPREN_BOND_TREE, FUTURE_SIGHT_TREE],
    talentNodes: []
};
