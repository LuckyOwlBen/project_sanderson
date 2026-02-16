import { TalentTree, TalentPath } from '../talentInterface';
import { SINGER_FORMS_TALENT_TREE } from './singerForms';
import { WARRIOR_TALENT_TREE } from './warrior/warriorTalentTree';
import { DUELIST_TALENT_TREE } from './warrior/duelist';
import { SHARDBEARER_TALENT_TREE } from './warrior/shardbearer';
import { SOLDIER_TALENT_TREE } from './warrior/soldier';
import { SCHOLAR_TALENT_TREE } from './scholar/scholarTalentTrees';
import { ARTIFABRIAN_TALENT_TREE } from './scholar/artifabrian';
import { STRATEGIST_TALENT_TREE } from './scholar/strategist';
import { SURGEON_TALENT_TREE } from './scholar/surgeon';
import { HUNTER_TALENT_TREES } from './hunter/hunterTalentTrees';
import { ARCHER_TALENT_TREE } from './hunter/archer';
import { ASSASSIN_TALENT_TREE } from './hunter/assassin';
import { TRACKER_TALENT_TREE } from './hunter/tracker';
import { LEADER_TALENT_TREE } from './leader/leaderTalentTrees';
import { CHAMPION_TALENT_TREE } from './leader/champion';
import { OFFICER_TALENT_TREE } from './leader/officer';
import { POLITICO_TALENT_TREE } from './leader/politico';
import { ENVOY_HEROIC_PATH } from './envoy/envoyHeroicPaths';
import { DIPLOMAT_TALENT_TREE } from './envoy/diplomat';
import { FAITHFUL_TALENT_TREE } from './envoy/faithful';
import { MENTOR_TALENT_TREE } from './envoy/mentor';
import { AGENT_HEROIC_PATH } from './agent/agentHeroicPath';
import { INVESTIGATOR_TALENT_TREE } from './agent/Investigator';
import { SPY_TALENT_TREE } from './agent/spy';
import { THIEF_TALENT_TREE } from './agent/thief';

// Radiant Orders
import { WINDRUNNER_TALENT_TREE } from './radiant/windrunner';
import { SKYBREAKER_TALENT_TREE } from './radiant/skybreaker';
import { DUSTBRINGER_TALENT_TREE } from './radiant/dustbringer';
import { EDGEDANCER_TALENT_TREE } from './radiant/edgedancer';
import { TRUTHWATCHER_TALENT_TREE } from './radiant/truthwatcher';
import { LIGHTWEAVER_TALENT_TREE } from './radiant/lightweaver';
import { ELSECALLER_TALENT_TREE } from './radiant/elsecaller';
import { WILLSHAPER_TALENT_TREE } from './radiant/willshaper';
import { STONEWARD_TALENT_TREE } from './radiant/stoneward';
import { BONDSMITH_TALENT_TREE } from './radiant/bondsmith';

// Surge Trees
import { ADHESION_SURGE_TREE } from './surges/adhesion';
import { GRAVITATION_SURGE_TREE } from './surges/gravitation';
import { DIVISION_SURGE_TREE } from './surges/division';
import { ABRASION_SURGE_TREE } from './surges/abrasion';
import { PROGRESSION_SURGE_TREE } from './surges/progression';
import { ILLUMINATION_SURGE_TREE } from './surges/illumination';
import { TRANSFORMATION_SURGE_TREE } from './surges/transformation';
import { TRANSPORTATION_SURGE_TREE } from './surges/transportation';
import { COHESION_SURGE_TREE } from './surges/cohesion';
import { TENSION_SURGE_TREE } from './surges/tension';

export const ALL_TALENT_TREES: Record<string, TalentTree> = {
    //Tree Files Go Here
    singerForms: SINGER_FORMS_TALENT_TREE,
    singer: SINGER_FORMS_TALENT_TREE,  // Map ancestry to talent tree
    
    // Warrior Specializations
    duelist: DUELIST_TALENT_TREE,
    shardbearer: SHARDBEARER_TALENT_TREE,
    soldier: SOLDIER_TALENT_TREE,
    
    // Scholar Specializations
    artifabrian: ARTIFABRIAN_TALENT_TREE,
    strategist: STRATEGIST_TALENT_TREE,
    surgeon: SURGEON_TALENT_TREE,
    
    // Hunter Specializations
    archer: ARCHER_TALENT_TREE,
    assassin: ASSASSIN_TALENT_TREE,
    tracker: TRACKER_TALENT_TREE,
    
    // Leader Specializations
    champion: CHAMPION_TALENT_TREE,
    officer: OFFICER_TALENT_TREE,
    politico: POLITICO_TALENT_TREE,
    
    // Envoy Specializations
    diplomat: DIPLOMAT_TALENT_TREE,
    faithful: FAITHFUL_TALENT_TREE,
    mentor: MENTOR_TALENT_TREE,
    
    // Agent Specializations
    investigator: INVESTIGATOR_TALENT_TREE,
    spy: SPY_TALENT_TREE,
    thief: THIEF_TALENT_TREE,
    
    // Surge Trees
    adhesion: ADHESION_SURGE_TREE,
    gravitation: GRAVITATION_SURGE_TREE,
    division: DIVISION_SURGE_TREE,
    abrasion: ABRASION_SURGE_TREE,
    progression: PROGRESSION_SURGE_TREE,
    illumination: ILLUMINATION_SURGE_TREE,
    transformation: TRANSFORMATION_SURGE_TREE,
    transportation: TRANSPORTATION_SURGE_TREE,
    cohesion: COHESION_SURGE_TREE,
    tension: TENSION_SURGE_TREE,
};

export const ALL_TALENT_PATHS: Record<string, TalentPath> = {
    warrior: WARRIOR_TALENT_TREE,
    scholar: SCHOLAR_TALENT_TREE,
    hunter: HUNTER_TALENT_TREES,
    leader: LEADER_TALENT_TREE,
    envoy: ENVOY_HEROIC_PATH,
    agent: AGENT_HEROIC_PATH,
    
    // Radiant Orders
    windrunner: WINDRUNNER_TALENT_TREE,
    skybreaker: SKYBREAKER_TALENT_TREE,
    dustbringer: DUSTBRINGER_TALENT_TREE,
    edgedancer: EDGEDANCER_TALENT_TREE,
    truthwatcher: TRUTHWATCHER_TALENT_TREE,
    lightweaver: LIGHTWEAVER_TALENT_TREE,
    elsecaller: ELSECALLER_TALENT_TREE,
    willshaper: WILLSHAPER_TALENT_TREE,
    stoneward: STONEWARD_TALENT_TREE,
    bondsmith: BONDSMITH_TALENT_TREE,
};

export function getTalentTree(pathName: string): TalentTree | undefined {
    return ALL_TALENT_TREES[pathName.toLowerCase()];
}

export function getTalentPath(pathName: string): TalentPath | undefined {
    return ALL_TALENT_PATHS[pathName.toLowerCase()];
}

export function getAllTalentTrees(): TalentTree[] {
    return Object.values(ALL_TALENT_TREES);
}