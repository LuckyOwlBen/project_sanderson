import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { Character } from '../../../character/character';
import { TalentNode, TalentTree, ActionCostCode } from '../../../../../shared/types/talents';
import { ALL_TALENT_PATHS, getTalentTree, getTalentPath } from '../../../../../shared/data/talents/talentTrees';
import { ExpertiseSource, ExpertiseSourceHelper } from '../../../character/expertises/expertiseSource';
import { UniversalAbility, formatActionCost, SINGER_FORMS } from '../../../character/abilities/universalAbilities';
import { Attack } from '../../../../../shared/types/attacks';
import { StanceSelectorComponent } from '../stance-selector/stance-selector';

export interface GroupedPower {
  base: TalentNode;
  modifiers: TalentNode[];
  /** Calculated attack stats if this talent has an attackDefinition */
  attack?: Attack;
}

/** A single section in the action-economy layout */
export interface ActionEconomySection {
  key: string;
  title: string;
  icon: string;
  accentClass: string;
  groups: GroupedPower[];
}

/** Wraps a UniversalAbility for display in action-economy sections */
export interface UniversalAbilityItem {
  ability: UniversalAbility;
}

@Component({
  selector: 'app-character-powers-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    StanceSelectorComponent
  ],
  templateUrl: './character-powers-tab.html',
  styleUrl: './character-powers-tab.scss',
})
export class CharacterPowersTab {
  @Input() character: Character | null = null;

  getSelectedExpertises(): ExpertiseSource[] {
    return this.character?.selectedExpertises || [];
  }

  getExpertiseSourceBadge(expertise: ExpertiseSource): string {
    return ExpertiseSourceHelper.getSourceBadge(expertise.source);
  }

  /**
   * Get only non-Singer universal abilities (Radiant powers, items, etc.)
   * These get merged into action-economy sections.
   */
  getRadiantAbilities(): UniversalAbility[] {
    const all = this.character?.getUniversalAbilities() || [];
    const singerFormIds = new Set(SINGER_FORMS.map(f => f.id));
    return all.filter(a => !singerFormIds.has(a.id) && a.source !== 'Singer Ancestry');
  }

  formatAbilityActionCost(cost: number | string): string {
    return formatActionCost(cost);
  }

  getAbilityResourceCost(ability: UniversalAbility): string {
    if (!ability.resourceCost) {
      return '';
    }
    const { resourceType, amount } = ability.resourceCost;
    const displayType = resourceType.charAt(0).toUpperCase() + resourceType.slice(1);
    return `${amount} ${displayType}`;
  }

  /**
   * Core method: Buckets all talents + radiant abilities into action-economy sections.
   * Returns only non-empty sections.
   */
  getActionEconomySections(): ActionEconomySection[] {
    const grouped = this.getGroupedPowers();
    const attacks = this.character?.getAvailableAttacks() || [];
    const attackByTalentId = new Map(attacks.filter(a => a.talentId).map(a => [a.talentId!, a]));

    // Attach calculated attack stats to grouped powers that have attackDefinitions
    for (const group of grouped) {
      const attack = attackByTalentId.get(group.base.id);
      if (attack) {
        group.attack = attack;
      }
    }

    // Also include weapon-only and combined attacks as pseudo-groups
    const talentAttackIds = new Set(grouped.filter(g => g.attack).map(g => g.attack!.id));
    const weaponAttacks = attacks.filter(a => !talentAttackIds.has(a.id));

    // Bucket grouped talents by action cost
    const oneAction: GroupedPower[] = [];
    const multiAction: GroupedPower[] = [];
    const freeAction: GroupedPower[] = [];
    const reaction: GroupedPower[] = [];
    const special: GroupedPower[] = [];
    const passive: GroupedPower[] = [];

    for (const group of grouped) {
      const cost = group.base.actionCost;
      if (cost === ActionCostCode.Passive || cost === Infinity) {
        passive.push(group);
      } else if (cost === ActionCostCode.Reaction || cost === -1) {
        reaction.push(group);
      } else if (cost === ActionCostCode.Special || cost === -2) {
        special.push(group);
      } else if (cost === ActionCostCode.Free || cost === 0) {
        freeAction.push(group);
      } else if (cost === 1) {
        oneAction.push(group);
      } else {
        multiAction.push(group);
      }
    }

    // Merge radiant universal abilities into the appropriate buckets
    for (const ability of this.getRadiantAbilities()) {
      const pseudoGroup = this.universalAbilityToGroupedPower(ability);
      if (!pseudoGroup) continue;
      const cost = ability.actionCost;
      if (cost === 'passive') {
        passive.push(pseudoGroup);
      } else if (cost === 'reaction') {
        reaction.push(pseudoGroup);
      } else if (cost === 'special') {
        special.push(pseudoGroup);
      } else if (cost === 'free') {
        freeAction.push(pseudoGroup);
      } else if (typeof cost === 'number' && cost === 1) {
        oneAction.push(pseudoGroup);
      } else if (typeof cost === 'number' && cost > 1) {
        multiAction.push(pseudoGroup);
      }
    }

    // Add weapon-only attacks to 1-action or multi-action
    for (const attack of weaponAttacks) {
      const pseudoGroup = this.attackToGroupedPower(attack);
      if (attack.actionCost === 1) {
        oneAction.push(pseudoGroup);
      } else {
        multiAction.push(pseudoGroup);
      }
    }

    const sections: ActionEconomySection[] = [];

    if (oneAction.length > 0) {
      sections.push({ key: 'one-action', title: '1 Action', icon: '⚡', accentClass: 'accent-action', groups: oneAction });
    }
    if (multiAction.length > 0) {
      sections.push({ key: 'multi-action', title: 'Multi-Action', icon: '⚡⚡', accentClass: 'accent-multi', groups: multiAction });
    }
    if (freeAction.length > 0) {
      sections.push({ key: 'free-action', title: 'Free Actions', icon: '💨', accentClass: 'accent-free', groups: freeAction });
    }
    if (reaction.length > 0) {
      sections.push({ key: 'reaction', title: 'Reactions', icon: '🛡️', accentClass: 'accent-reaction', groups: reaction });
    }
    if (special.length > 0) {
      sections.push({ key: 'special', title: 'Special Activations', icon: '🔮', accentClass: 'accent-special', groups: special });
    }
    if (passive.length > 0) {
      sections.push({ key: 'passive', title: 'Passives', icon: '🔒', accentClass: 'accent-passive', groups: passive });
    }

    return sections;
  }

  /**
   * Wrap a UniversalAbility as a pseudo-GroupedPower for unified rendering.
   */
  private universalAbilityToGroupedPower(ability: UniversalAbility): GroupedPower | null {
    const pseudo: TalentNode = {
      id: ability.id,
      name: ability.name,
      description: ability.description,
      actionCost: typeof ability.actionCost === 'number' ? ability.actionCost
        : ability.actionCost === 'free' ? ActionCostCode.Free
        : ability.actionCost === 'reaction' ? ActionCostCode.Reaction
        : ability.actionCost === 'special' ? ActionCostCode.Special
        : ActionCostCode.Passive,
      specialActivation: ability.specialActivation,
      prerequisites: [],
      tier: 0,
      bonuses: [],
      otherEffects: ability.effects,
      _source: ability.source,
      _resourceCost: ability.resourceCost,
      _canUseWhileUnconscious: ability.canUseWhileUnconscious,
      _limitations: ability.limitations,
      _isUniversalAbility: true,
    } as any;
    return { base: pseudo, modifiers: [] };
  }

  /**
   * Wrap a weapon Attack as a pseudo-GroupedPower for unified rendering.
   */
  private attackToGroupedPower(attack: Attack): GroupedPower {
    const pseudo: TalentNode = {
      id: attack.id,
      name: attack.name,
      description: attack.description,
      actionCost: attack.actionCost,
      prerequisites: [],
      tier: 0,
      bonuses: [],
      _isWeaponAttack: true,
    } as any;
    return { base: pseudo, modifiers: [], attack };
  }

  getGroupedPowers(): GroupedPower[] {
    const powers = this.getPowers();
    const powersById = new Map<string, TalentNode>();
    for (const p of powers) {
      powersById.set(p.id, p);
    }

    // Normalize modifiesTalent to always return an array
    const getModifiesIds = (talent: TalentNode): string[] => {
      if (!talent.modifiesTalent) return [];
      return Array.isArray(talent.modifiesTalent) ? talent.modifiesTalent : [talent.modifiesTalent];
    };

    // Resolve the root base for a single modifier chain
    const resolveRoot = (talent: TalentNode, baseId: string): string | undefined => {
      let currentId = baseId;
      const visited = new Set<string>();
      while (currentId && !visited.has(currentId)) {
        visited.add(currentId);
        const parent = powersById.get(currentId);
        if (!parent) return currentId; // parent not unlocked
        const parentBases = getModifiesIds(parent);
        if (parentBases.length === 0) return parent.id; // found the root
        currentId = parentBases[0]; // follow first chain for nested modifiers
      }
      return currentId;
    };

    const modifierIds = new Set<string>();
    const groupMap = new Map<string, TalentNode[]>();

    for (const power of powers) {
      const bases = getModifiesIds(power);
      if (bases.length === 0) continue;
      for (const baseId of bases) {
        const rootId = resolveRoot(power, baseId);
        if (!rootId || !powersById.has(rootId)) continue; // base not unlocked — show standalone
        modifierIds.add(power.id);
        const list = groupMap.get(rootId) || [];
        if (!list.includes(power)) list.push(power);
        groupMap.set(rootId, list);
      }
    }

    const grouped: GroupedPower[] = [];
    for (const power of powers) {
      if (modifierIds.has(power.id)) continue; // skip — will appear nested under base
      const modifiers = groupMap.get(power.id) || [];
      modifiers.sort((a, b) => a.tier - b.tier);
      grouped.push({ base: power, modifiers });
    }
    return grouped;
  }

  getPowers(): TalentNode[] {
    // Safely handle unlockedTalents which can be a Set or an array
    let powerIds: string[] = [];
    if (this.character?.unlockedTalents) {
      if (this.character.unlockedTalents instanceof Set) {
        powerIds = Array.from(this.character.unlockedTalents);
      } else if (Array.isArray(this.character.unlockedTalents)) {
        powerIds = this.character.unlockedTalents;
      }
    }
    
    const powers: TalentNode[] = [];
    const allTrees: TalentTree[] = [];
    
    // Load all talent paths (main core + specialization)
    if (this.character?.paths && this.character.paths.length > 0) {
      this.character.paths.forEach(pathName => {
        const path = getTalentPath(pathName);
        if (path) {
          if (path.talentNodes) {
            allTrees.push({ pathName: path.name, nodes: path.talentNodes });
          }
          if (path.paths) {
            allTrees.push(...path.paths);
          }
        }
      });
    }
    
    // Also load all other paths from ALL_TALENT_PATHS as fallback
    Object.values(ALL_TALENT_PATHS).forEach(path => {
      if (path.talentNodes) {
        allTrees.push({ pathName: path.name, nodes: path.talentNodes });
      }
      if (path.paths) {
        allTrees.push(...path.paths);
      }
    });
    
    // Add ancestry tree if applicable
    const ancestryTree = getTalentTree('singer');
    if (ancestryTree) {
      allTrees.push(ancestryTree);
    }
    
    // Find and add all talents
    powerIds.forEach(powerId => {
      for (const tree of allTrees) {
        const power = tree.nodes.find(n => n.id === powerId);
        if (power) {
          powers.push(power);
          break;
        }
      }
    });
    
    // If the character has spoken the First Ideal, ensure base surge powers are shown
    if (this.character?.radiantPath.hasSpokenIdeal()) {
      const surgeTreeIds = this.character.radiantPath.getSurgeTrees();
      surgeTreeIds.forEach(treeId => {
        const surgeTree = getTalentTree(treeId);
        if (surgeTree) {
          const baseNode = surgeTree.nodes.find(n => n.tier === 0);
          if (baseNode && !powers.some(p => p.id === baseNode.id)) {
            powers.push(baseNode);
          }
        }
      });
    }

    return powers;
  }

  getActionCostDisplay(actionCost: number | ActionCostCode): string {
    if (actionCost === ActionCostCode.Passive) {
      return 'Passive';
    } else if (actionCost === ActionCostCode.Reaction) {
      return 'Reaction';
    } else if (actionCost === ActionCostCode.Special) {
      return 'Special';
    } else if (actionCost === ActionCostCode.Free) {
      return 'Free Action';
    } else {
      return `${actionCost} Action${actionCost > 1 ? 's' : ''}`;
    }
  }

  getBonusDisplay(power: TalentNode): string[] {
    if (!power.bonuses || power.bonuses.length === 0) {
      return [];
    }
    
    return power.bonuses.map(bonus => {
      const parts: string[] = [];
      
      if (bonus.value !== undefined) {
        const sign = bonus.value >= 0 ? '+' : '';
        parts.push(`${sign}${bonus.value}`);
      }
      
      if (bonus.type) {
        parts.push(bonus.type.toString());
      }
      
      if (bonus.target) {
        parts.push(`to ${bonus.target}`);
      }
      
      if (bonus.condition) {
        parts.push(`(${bonus.condition})`);
      }
      
      return parts.join(' ');
    });
  }

  getOtherEffects(power: TalentNode): string[] {
    const effects: string[] = [];
    
    if (power.grantsAdvantage && power.grantsAdvantage.length > 0) {
      effects.push(`Grants Advantage on: ${power.grantsAdvantage.join(', ')}`);
    }
    
    if (power.grantsDisadvantage && power.grantsDisadvantage.length > 0) {
      effects.push(`Grants Disadvantage on: ${power.grantsDisadvantage.join(', ')}`);
    }
    
    if (power.otherEffects && power.otherEffects.length > 0) {
      effects.push(...power.otherEffects);
    }
    
    return effects;
  }

  /** Whether a GroupedPower has rich attack stats to display */
  hasAttackStats(group: GroupedPower): boolean {
    return !!group.attack;
  }

  /** Format attack bonus with + sign */
  formatBonus(bonus: number): string {
    return bonus >= 0 ? `+${bonus}` : `${bonus}`;
  }

  /** Get icon for attack source */
  getSourceIcon(source: string): string {
    switch (source) {
      case 'weapon': return '⚔️';
      case 'talent': return '✨';
      case 'combined': return '💥';
      default: return '⚔️';
    }
  }

  /** Get defense color class */
  getDefenseClass(defense: string): string {
    switch (defense.toLowerCase()) {
      case 'physical': return 'defense-physical';
      case 'cognitive': return 'defense-cognitive';
      case 'spiritual': return 'defense-spiritual';
      default: return '';
    }
  }

  /** Get damage type color class */
  getDamageTypeClass(damageType: string): string {
    switch (damageType.toLowerCase()) {
      case 'keen': return 'damage-keen';
      case 'impact': return 'damage-impact';
      case 'energy': return 'damage-energy';
      case 'vital': return 'damage-vital';
      case 'spirit': return 'damage-spirit';
      default: return '';
    }
  }

  /** Check if this is a universal ability pseudo-node */
  isUniversalAbility(node: TalentNode): boolean {
    return !!(node as any)._isUniversalAbility;
  }

  /** Get source label for universal abilities */
  getAbilitySource(node: TalentNode): string {
    return (node as any)._source || '';
  }

  /** Get resource cost for universal abilities */
  getNodeResourceCost(node: TalentNode): string {
    const rc = (node as any)._resourceCost;
    if (!rc) return '';
    const displayType = rc.resourceType.charAt(0).toUpperCase() + rc.resourceType.slice(1);
    return `${rc.amount} ${displayType}`;
  }

  /** Get limitations for universal abilities */
  getNodeLimitations(node: TalentNode): string[] {
    return (node as any)._limitations || [];
  }

  /** Check if usable while unconscious */
  canUseWhileUnconscious(node: TalentNode): boolean {
    return !!(node as any)._canUseWhileUnconscious;
  }

  /**
   * Handle stance change event from the stance selector
   */
  onStanceChanged(stanceId: string | null): void {
    // Stance change is already handled in the Character class via setActiveStance()
    // This callback is available for future expansion (e.g., logging, analytics)
    console.log(`Stance changed to: ${stanceId || 'None'}`);
  }
}
