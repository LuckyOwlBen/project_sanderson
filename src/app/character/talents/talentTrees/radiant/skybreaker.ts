import { TalentPath, TalentTree, ActionCostCode } from "../../talentInterface";

const HIGHSPREN_BOND_TREE: TalentTree = {
    pathName: "Highspren Bond",
    nodes: [
        {
            id: 'skybreaker_key_talent',
            name: 'First Ideal (Skybreaker Key)',
            description: 'You begin bonding a highspren, allowing you to breathe in and use Stormlight. You might be aware of this nascent bond, or you might use the powers subconsciously until you get closer to speaking the First Ideal. When you acquire this talent, you gain access to Investiture, beginning with a maximum Investiture of 2 + your Awareness or Presence (whichever is higher). You can now use the Breathe Stormlight, Enhance, and Regenerate actions. Additionally, you gain the goal "Speak the First Ideal." After you complete this goal, you gain the following reward: You become Empowered until the end of that scene. You gain the Division and Gravitation surges. You gain an additional skill on your character sheet for the above surges, starting with 1 rank in each.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'When bonding a highspren at level 2+',
            prerequisites: [{ type: 'level', target: 'character', value: 2 }],
            tier: 0,
            bonuses: [],
            otherEffects: [
                'Grants Investiture resource (max = 2 + higher of Awareness or Presence)',
                'Unlocks Breathe Stormlight, Enhance, and Regenerate actions',
                'Grants goal: Speak the First Ideal',
                'Reward: Become Empowered until end of scene',
                'Reward: Gain Division and Gravitation surge skills at rank 1',
                'Reward: Grants access to Division and Gravitation surge trees'
            ]
        },
        {
            id: 'skybreaker_soaring_destruction',
            name: 'Soaring Destruction',
            description: 'You excel at using Division while sweeping through the air with Gravitation. After you Move while maintaining a Basic Lashing on yourself with your Gravitation surge, spend 1 focus to gain an action, which can be used only for Division or one of its talents.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'After you Move while maintaining a Basic Lashing on yourself',
            prerequisites: [{ type: 'ideal', target: 'first', value: 1 }],
            tier: 1,
            bonuses: [],
            otherEffects: [
                'Spend 1 focus after lashed movement to gain bonus action',
                'Bonus action only for Division surge or Division talents'
            ]
        },
        {
            id: 'skybreaker_invested',
            name: 'Invested',
            description: 'You learn to hold and wield greater quantities of Stormlight within yourself. When you acquire this talent, your maximum Investiture increases by a number equal to your tier. When your tier increases by 1, your maximum Investiture does as well.',
            actionCost: ActionCostCode.Passive,
            prerequisites: [{ type: 'talent', target: 'skybreaker_soaring_destruction' }],
            tier: 2,
            bonuses: [],
            otherEffects: ['Increases max Investiture by tier value permanently']
        },
        {
            id: 'skybreaker_second_ideal',
            name: 'Second Ideal (Skybreaker)',
            description: 'You seek to deepen your Nahel bond with your highspren by speaking the Second Ideal. You gain the goal "Speak the Second Ideal." After you complete this goal, you gain the following reward: You become Empowered until the end of that scene. Your Enhance action becomes more powerful. While you have 1 Investiture or more, you can use Enhance as a free action, and you don\'t need to spend Investiture to use this action or maintain its effect.',
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
            id: 'skybreaker_wound_regeneration',
            name: 'Wound Regeneration',
            description: 'You can use Stormlight to rapidly recover from injuries. When you use the Regenerate free action, you can spend Investiture to instantly recover from an injury of your choice (either instead of or in addition to healing yourself). Spend 2 Investiture to recover from a temporary injury, or spend 3 Investiture to recover from a permanent one.',
            actionCost: ActionCostCode.Special,
            specialActivation: 'When you use the Regenerate action',
            prerequisites: [{ type: 'talent', target: 'skybreaker_invested' }],
            tier: 4,
            bonuses: [],
            otherEffects: [
                'Can heal temporary injury for 2 Investiture',
                'Can heal permanent injury for 3 Investiture'
            ]
        },
        {
            id: 'skybreaker_third_ideal',
            name: 'Third Ideal (Skybreaker)',
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
            id: 'skybreaker_deepened_bond',
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
            id: 'skybreaker_take_squire',
            name: 'Take Squire (Skybreaker)',
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
            id: 'skybreaker_fourth_ideal',
            name: 'Fourth Ideal (Skybreaker)',
            description: 'You seek to become a full Knight Radiant by speaking the Fourth Ideal. You immediately speak the Fourth Ideal and must decide on a suitable quest in line with your values. You gain the goal "Complete Your Fourth Ideal Quest." After you complete this goal, you gain the following reward: You become Empowered until the end of that scene. You can call a swarm of luckspren as Radiant Shardplate (see chapter 7).',
            actionCost: ActionCostCode.Special,
            specialActivation: 'Upon acquiring this talent, immediately speak Fourth Ideal and choose quest',
            prerequisites: [
                { type: 'level', target: 'character', value: 13 },
                { type: 'ideal', target: 'third', value: 3 }
            ],
            tier: 7,
            bonuses: [],
            otherEffects: [
                'Immediately speak Fourth Ideal upon taking this talent',
                'Grants goal: Complete Your Fourth Ideal Quest',
                'Reward: Become Empowered until end of scene',
                'Reward: Can summon Radiant Shardplate'
            ]
        }
    ]
};

export const SKYBREAKER_TALENT_TREE: TalentPath = {
    name: "Skybreaker",
    paths: [HIGHSPREN_BOND_TREE],
    talentNodes: []
};
