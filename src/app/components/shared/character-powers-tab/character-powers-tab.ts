import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { Character } from '../../../character/character';
import { TalentNode, TalentTree, ActionCostCode } from '../../../character/talents/talentInterface';
import { ALL_TALENT_PATHS, getTalentTree } from '../../../character/talents/talentTrees/talentTrees';
import { ExpertiseSource, ExpertiseSourceHelper } from '../../../character/expertises/expertiseSource';
import { UniversalAbility, formatActionCost } from '../../../character/abilities/universalAbilities';
import { CharacterAttacksComponent } from '../character-attacks/character-attacks';
import { StanceSelectorComponent } from '../stance-selector/stance-selector';

@Component({
  selector: 'app-character-powers-tab',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatExpansionModule,
    CharacterAttacksComponent,
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

  getUniversalAbilities(): UniversalAbility[] {
    return this.character?.getUniversalAbilities() || [];
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

  getPowers(): TalentNode[] {
    const powerIds = Array.from(this.character?.unlockedTalents || []);
    const powers: TalentNode[] = [];
    
    const allTrees: TalentTree[] = [];
    
    Object.values(ALL_TALENT_PATHS).forEach(path => {
      if (path.talentNodes) {
        allTrees.push({ pathName: path.name, nodes: path.talentNodes });
      }
      allTrees.push(...path.paths);
    });
    
    const ancestryTree = getTalentTree('singer');
    if (ancestryTree) {
      allTrees.push(ancestryTree);
    }
    
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

  /**
   * Handle stance change event from the stance selector
   */
  onStanceChanged(stanceId: string | null): void {
    // Stance change is already handled in the Character class via setActiveStance()
    // This callback is available for future expansion (e.g., logging, analytics)
    console.log(`Stance changed to: ${stanceId || 'None'}`);
  }
}
