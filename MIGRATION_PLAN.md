# Talent Path Migration to Structured Properties

## Completed

### Envoy Path
- ✅ **diplomat.ts** - Migrated: steadfast_challenge, withering_retort, well_dressed, high_society_contacts, practiced_oratory
- ✅ **faithful.ts** - Migrated: galvanize, applied_motivation, composed, customary_garb, inspired_zeal, stalwart_presence
- ✅ **mentor.ts** - Migrated: practical_demonstration, sound_advice, foresight (partial - lessons_in_patience, instill_confidence need full completion)
- ✅ **envoyHeroicPaths.ts** - Migrated: rousing_presence

### Scholar Path
- ⏳ **strategist.ts** - Migrated: composed, keen_insight (Need: mind_and_body, strategize, know_your_moment, deep_contemplation, contingency, turning_point)
- ⏳ **surgeon.ts** - Not started
- ⏳ **artifabrian.ts** - Not started

## Remaining Work

### Scholar Path

#### strategist.ts
1. **mind_and_body** - Keep otherEffects (Erudition modification complex)
   - otherEffects: ["Erudition grants +1 skill", "Erudition can select physical skills (non-surge)", "Gain weapon expertise of choice"]

2. **strategize** - Split into actionGrants + resourceTriggers
   - resourceTriggers: Can spend 2 focus to prevent target reactions
   - otherEffects: Complex advantage passing mechanic

3. **know_your_moment** - Keep in otherEffects
   - Already has: otherEffects: ["After beginning of each round: +2 to all defenses until start of your turn"]

4. **deep_contemplation** - Keep in otherEffects (reassignment mechanics)
   - otherEffects: ["Reassign up to 2 skills/expertises from Erudition"]

5. **contingency** - Already migrated ✅

6. **turning_point** - Already migrated ✅

#### surgeon.ts - ALL TALENTS

1. **emotional_intelligence** - Keep otherEffects (Erudition + expertise)
   - otherEffects: ["Erudition grants +1 skill", "Erudition can select spiritual skills (non-surge)", "Gain Diagnosis utility expertise"]

2. **field_medicine** - Split
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 1, trigger: 'to use this talent' }]
   - otherEffects: ["Test Medicine DC 15", "Roll target's recovery die", "Disadvantage when treating self", "Success: recover recovery die + Medicine ranks", "Failure: recover recovery die only"]

3. **anatomical_insight** - Split
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 1, trigger: 'when hitting with unarmed attack' }]
   - conditionEffects: [{ type: 'apply', condition: 'Exhausted', trigger: 'when hitting with unarmed', target: 'target', details: 'Exhausted penalty = half Medicine ranks (rounded up)' }]

4. **collected** - Remove otherEffects (already in bonuses)
   - Just have bonuses with defense increases

5. **swift_healer** - Split
   - actionGrants: [{ type: 'free-action', count: 1, frequency: 'unlimited', restrictedTo: 'Field Medicine' }]
   - resourceTriggers: [{ resource: 'health', effect: 'recover', amount: 'medicine_ranks', trigger: 'when restoring health to others' }]

6. **applied_medicine** - Use resourceTriggers
   - resourceTriggers: [{ resource: 'health', effect: 'recover', amount: 'lore_ranks', trigger: 'when causing health recovery' }]

7. **ongoing_care** - Keep otherEffects (rest-based complex mechanics)
   - expertiseGrants: [{ type: 'fixed', expertises: ['Mental Health Care'] }]
   - otherEffects: ["Forgo short/long rest to treat ally", "Test Medicine DC 10 (+5 per injury beyond first)", "Success: remove 1 condition from injury", "Target can benefit once per 24 hours"]

8. **resuscitation** - Keep otherEffects (resurrection complex)
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 3, trigger: 'to use this talent on Unconscious/dead target' }]
   - otherEffects: ["Use Field Medicine to resuscitate", "Target Unconscious or died within Medicine rank rounds", "DC +5 per injury beyond first", "Success: recover health, return to life if dead, optionally remove Unconscious"]

#### artifabrian.ts - ALL TALENTS

All talents have complex crafting/fabrial mechanics that should mostly stay in otherEffects, but we can extract:

1. **efficient_engineer** - Extract expertise, keep rest
   - expertiseGrants: [{ type: 'choice', choiceCount: 1, options: ['Armor Crafting', 'Equipment Crafting', 'Weapon Crafting'] }]
   - otherEffects: [remaining complex mechanics]

2. **prized_acquisition** - Extract expertise, keep rest
   - expertiseGrants: [{ type: 'fixed', expertises: ['Fabrial Crafting'] }]
   - otherEffects: [gemstone and time mechanics]

3. **deep_study** - Keep otherEffects (Erudition modification)

4. **fine_handiwork** - Keep otherEffects (upgrade system)

5. **inventive_design** - Keep otherEffects (fabrial tier mechanics)

6. **overcharge** - Extract action grant
   - actionGrants: [{ type: 'free-action', count: 1, timing: 'always', restrictedTo: 'Strike with fabrial', frequency: 'once-per-turn' }]
   - otherEffects: [risk/reward mechanics]

7. **experimental_tinkering** - Keep otherEffects (long rest reconfiguration)

8. **overwhelm_with_detail** - Extract resourceTrigger
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 2, trigger: 'to use Lore instead of skill for test' }]

---

### Leader Path

#### champion.ts - ALL TALENTS

1. **combat_coordination** - Extract action grant
   - actionGrants: [{ type: 'free-action', count: 1, timing: 'after-attack', restrictedTo: 'Decisive Command' }]
   - resourceTriggers: [{ resource: 'focus', effect: 'reduce-cost', amount: 1, trigger: 'if Strike missed' }]

2. **valiant_intervention** - Extract attack definition and action grants
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 1, trigger: 'to use this talent' }]
   - attackDefinition: { targetDefense: 'Spiritual', range: 'special', weaponType: 'unarmed' }
   - otherEffects: [movement and reaction restriction mechanics]

3. **hardy** - Extract to resourceTriggers
   - resourceTriggers: [{ resource: 'health', effect: 'recover', amount: '1_per_level', trigger: 'on talent acquisition and future levels', frequency: 'unlimited' }]

4. **imposing_posture** - Extract condition
   - conditionEffects: [{ type: 'apply', condition: 'Disoriented', trigger: 'after enemy resists influence within weapon reach', target: 'target', duration: 'until end of next turn' }]

5. **resolute_stand** - Extract resourceTriggers and condition
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 'leadership_ranks', trigger: 'to target additional characters with Valiant Intervention' }]
   - conditionEffects: [{ type: 'prevent', condition: 'Reactive Strikes', target: 'target', duration: 'until end of their next turn' }]

6. **mighty** - Keep otherEffects (damage scaling mechanic)

7. **demonstrative_command** - Extract resourceTrigger
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 1, trigger: 'before Athletics/Agility/Leadership test', frequency: 'unlimited' }]
   - otherEffects: [command die and die size increase]

8. **resilient_hero** - Extract action grant
   - actionGrants: [{ type: 'reaction', count: 1, timing: 'always', frequency: 'once-per-scene', condition: 'before reduced to 0 health' }]
   - otherEffects: [health swap mechanic]

#### officer.ts - ALL TALENTS

1. **composed** - Extract resourceTriggers
   - resourceTriggers: [same as other composed talents]

2. **through_the_fray** - Extract action grant
   - actionGrants: [{ type: 'action', count: 1, timing: 'before-end-of-turn', restrictedTo: 'Disengage or Gain Advantage', condition: 'reaction for chosen ally' }]

3. **customary_garb** - Remove otherEffects (already in bonuses)

4. **well_supplied** - Extract resourceTrigger
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 2, trigger: 'when requisitioning/allocating resources' }]
   - expertiseGrants: [{ type: 'fixed', expertises: ['Military Logistics'] }]

5. **confident_command** - Extract resourceTrigger
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 1, trigger: 'before Intimidation/Leadership/Persuasion test' }]
   - otherEffects: [command die increase]

6. **relentless_march** - Extract movementEffects and condition
   - movementEffects: [{ type: 'increase-rate', amount: 10, timing: 'always', condition: 'after Decisive Command on ally' }]
   - conditionEffects: [{ type: 'prevent', condition: 'Exhausted/Slowed/Surprised effects', target: 'target', duration: 'until end of next turn' }]

7. **authority** - Keep otherEffects (range/targeting modification)
   - otherEffects: ["Double range of Leader talents affecting allies", "Double number of allies affected"]
   - Special activation requirement for title

8. **synchronized_assault** - Extract action grants and resourceTrigger
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 2, trigger: 'to use this talent' }]
   - actionGrants: [{ type: 'action', count: 1, timing: 'start-of-turn', restrictedTo: 'Strike only against target', frequency: 'unlimited' }]
   - otherEffects: [test mechanics vs enemy leader]

#### politico.ts - ALL TALENTS

1. **cutthroat_tactics** - Extract resourceTrigger
   - resourceTriggers: [{ resource: 'focus', effect: 'recover', amount: 1, trigger: 'when ally raises stakes and rolls Complication' }]

2. **tactical_ploy** - Extract condition and resourceTrigger
   - conditionEffects: [{ type: 'apply', condition: 'disadvantage', trigger: 'on Deception success vs Cognitive', target: 'target', details: 'on next Cognitive/Spiritual test' }]
   - otherEffects: [reaction loss mechanic]
   - resourceTriggers: [resistance influence cost mechanic]

3. **rumormonger** - Extract resourceTrigger and expertise
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 2, trigger: 'when spreading misinformation/gathering rumors' }]
   - expertiseGrants: [{ type: 'fixed', expertises: ['Scandal'] }]

4. **well_dressed** - Clean up (already has grantsAdvantage)
   - expertiseGrants: [{ type: 'fixed', expertises: ['Fashion'] }]
   - Remove otherEffects redundancy

5. **baleful** - Extract resourceTrigger (complex)
   - resourceTriggers: [{ resource: 'focus', effect: 'reduce-cost', amount: '-tier', trigger: 'for characters resisting your influence', frequency: 'unlimited' }]

6. **set_at_odds** - Extract resourceTrigger, keep complex mechanics
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 'num_targets', trigger: 'to seed division among targets' }]
   - otherEffects: [influence and conflict mechanics]

7. **shrewd_command** - Extract resourceTrigger
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 1, trigger: 'before Deception/Insight/Leadership test' }]
   - otherEffects: [command die increase]

8. **grand_deception** - Extract resourceTrigger
   - resourceTriggers: [{ resource: 'focus', effect: 'spend', amount: 3, trigger: 'to reveal established detail as ruse' }]
   - otherEffects: [complexity and GM arbitration]

---

### Radiant Path (10 files - Most complex)

#### bondsmith.ts
1. **bondsmith_key_talent** - Extract to conditionEffects/actionGrants
   - Mostly narrative, keep in otherEffects

#### dustbringer.ts

1. **dustbringer_key_talent** - Extract resourceTriggers and actionGrants
   - resourceTriggers: [{ resource: 'investiture', effect: 'recover', amount: '2 + Awareness_or_Presence', trigger: 'when bonding ashspren' }]
   - actionGrants: [{ type: 'action', count: 3, frequency: 'unlimited', restrictedTo: 'Breathe Stormlight, Enhance, Regenerate' }]
   - otherEffects: [goal and reward narrative]

2. **dustbringer_searing_dust_storm** - Extract movementEffects and damageBonus
   - movementEffects: [{ type: 'special-movement', amount: 'investiture_spent', timing: 'as-part-of-action', movementType: 'kick up dust cloud', condition: 'dust lasts rounds = Investiture spent' }]
   - otherEffects: [dust cloud mechanics and bonus damage]

3. **dustbringer_invested** - Extract resourceTriggers
   - resourceTriggers: [{ resource: 'investiture', effect: 'recover', amount: 'tier', trigger: 'on talent acquisition', frequency: 'once-per-session' }]

4. **dustbringer_second_ideal** - Extract actionGrants
   - actionGrants: [{ type: 'free-action', count: 1, restrictedTo: 'Enhance', frequency: 'unlimited', condition: 'while having 1+ Investiture' }]
   - resourceTriggers: [{ resource: 'investiture', effect: 'reduce-cost', amount: -1, trigger: 'when using Enhance' }]
   - otherEffects: [goal and reward narrative]

5. **dustbringer_wound_regeneration** - Extract resourceTriggers
   - resourceTriggers: [
       { resource: 'investiture', effect: 'spend', amount: 2, trigger: 'to recover from temporary injury' },
       { resource: 'investiture', effect: 'spend', amount: 3, trigger: 'to recover from permanent injury' }
     ]

6. **dustbringer_third_ideal** - Extract actionGrants
   - actionGrants: [{ type: 'action', count: 1, frequency: 'unlimited', restrictedTo: 'Summon Radiant Shardblade' }]
   - otherEffects: [goal and reward narrative]

7. **dustbringer_deepened_bond** - Extract movementEffects and resourceTriggers
   - movementEffects: [{ type: 'special-movement', amount: 100, timing: 'always', condition: 'spren bond range' }]
   - resourceTriggers: [{ resource: 'focus', effect: 'reduce-cost', amount: -1, trigger: 'when giving spren tasks', frequency: 'unlimited' }]

8. **dustbringer_take_squire** - Keep otherEffects (complex companion mechanics)

9. **dustbringer_fourth_ideal** - Extract actionGrants
   - actionGrants: [{ type: 'action', count: 1, frequency: 'unlimited', restrictedTo: 'Summon Radiant Shardplate' }]
   - otherEffects: [goal and reward narrative]

[Similar patterns for: edgedancer, elsecaller, lightweaver, skybreaker, stoneward, truthwatcher, willshaper, windrunner]

---

## Strategy for Remaining Radiant Files

All Radiant paths follow similar patterns with Investiture mechanics:
- Key talents → resourceTriggers (Investiture max increase) + actionGrants (Breathe/Enhance/Regenerate)
- Invested talents → resourceTriggers (Investiture increase)
- Ideal talents → actionGrants (new actions/abilities) + otherEffects (narrative)
- Bond talents → movementEffects (range) + resourceTriggers (cost reduction)
- Special mechanics → movementEffects, conditionEffects, or otherEffects as appropriate

