/**
 * Attack Calculator Service
 * 
 * Generates available attacks from equipped weapons and combat talents.
 * Calculates attack bonuses, damage, and combines weapon/talent effects.
 */

import { Attack, AttackSource, DefenseType, Stance, AttackModifier } from './attackInterfaces';
import { Character } from '../character';
import { InventoryItem } from '../inventory/inventoryItem';
import { TalentNode, ActionCostCode, TalentPath } from '../talents/talentInterface';
import { ALL_TALENT_PATHS, getTalentTree } from '../talents/talentTrees/talentTrees';
import { SkillType } from '../skills/skillTypes';
import { BonusType } from '../bonuses/bonusModule';

export class AttackCalculator {
  private character: Character;
  private allTalents: Map<string, TalentNode>;

  constructor(character: Character) {
    this.character = character;
    this.allTalents = new Map();
    
    // Build talent lookup map
    const talentPaths = Object.values(ALL_TALENT_PATHS);
    talentPaths.forEach((path: TalentPath) => {
      path.paths.forEach(tree => {
        tree.nodes.forEach(node => {
          this.allTalents.set(node.id, node);
        });
      });
      // Also include path-level talents
      if (path.talentNodes) {
        path.talentNodes.forEach(node => {
          this.allTalents.set(node.id, node);
        });
      }
    });
    
    // Also include Singer forms if character is a singer
    const singerTree = getTalentTree('singer');
    if (singerTree) {
      singerTree.nodes.forEach(node => {
        this.allTalents.set(node.id, node);
      });
    }
  }

  /**
   * Get all available attacks for the character
   */
  getAvailableAttacks(): Attack[] {
    const attacks: Attack[] = [];

    // Generate weapon attacks
    attacks.push(...this.getWeaponAttacks());

    // Generate talent-based attacks
    attacks.push(...this.getTalentAttacks());

    // Generate combined weapon+talent attacks
    attacks.push(...this.getCombinedAttacks());

    return attacks;
  }

  /**
   * Convert weapon skill string to SkillType enum
   */
  private weaponSkillToSkillType(weaponSkill: string): SkillType {
    switch (weaponSkill) {
      case 'light-weaponry':
        return SkillType.LIGHT_WEAPONRY;
      case 'heavy-weaponry':
        return SkillType.HEAVY_WEAPONRY;
      case 'athletics':
        return SkillType.ATHLETICS;
      default:
        return SkillType.ATHLETICS; // Default fallback
    }
  }

  /**
   * Get attacks from equipped weapons
   */
  private getWeaponAttacks(): Attack[] {
    const attacks: Attack[] = [];
    const equippedWeapons = this.character.inventory.getAllEquippedItems()
      .filter(item => item.weaponProperties);

    for (const weapon of equippedWeapons) {
      const attack = this.generateWeaponAttack(weapon);
      if (attack) {
        attacks.push(attack);
      }
    }

    return attacks;
  }

  /**
   * Generate attack from weapon
   */
  private generateWeaponAttack(weapon: InventoryItem): Attack | null {
    if (!weapon.weaponProperties) return null;

    const props = weapon.weaponProperties;
    const skillType = this.weaponSkillToSkillType(props.skill);
    const skillRank = this.character.skills.getSkillRank(skillType);
    const skillTotal = this.character.skills.calculateSkillTotal(skillType, this.character.attributes);
    
    // Calculate attack bonus: skill total (rank + attribute)
    const attackBonus = skillTotal;

    // Get weapon traits
    const traits = [...props.traits];
    
    // Add expert traits if character has expertise
    const expertiseCheck = this.character.inventory.canUseExpertTraits(weapon.id);
    if (expertiseCheck.canUse) {
      traits.push(...props.expertTraits.map(t => `Expert: ${t}`));
      
      // Add trait grants from talents (e.g., Killing Edge adds Deadly and Quickdraw)
      const talentTraitGrants = this.getTraitGrantsForWeapon(weapon);
      traits.push(...talentTraitGrants.map(t => `Expert: ${t}`));
    }

    // Check for Mighty talent to add damage bonus
    const damageModifiers = this.getMightyDamageBonus();

    // Check for ranged bonuses (e.g., Steady Aim)
    const rangedBonusResult = this.getRangedBonusesForWeapon(props.range);
    const damageBonus = damageModifiers + rangedBonusResult.damageBonus;

    const attack: Attack = {
      id: `weapon_${weapon.id}`,
      name: weapon.name,
      source: 'weapon',
      weaponId: weapon.id,
      attackBonus,
      damage: this.formatDamage(props.damage, damageBonus),
      damageType: props.damageType,
      range: props.range,
      targetDefense: this.getWeaponDefenseType(props.skill),
      actionCost: 1, // Standard Strike action
      traits,
      description: `Strike with ${weapon.name}. ${weapon.description}`,
      customModifiers: rangedBonusResult.modifiers,
    };

    return attack;
  }

  /**
   * Get talent-based attacks (talents with action costs that make attacks)
   */
  private getTalentAttacks(): Attack[] {
    const attacks: Attack[] = [];
    const unlockedTalents = Array.from(this.character.unlockedTalents)
      .map(id => this.allTalents.get(id))
      .filter(t => t !== undefined) as TalentNode[];

    for (const talent of unlockedTalents) {
      const attack = this.generateTalentAttack(talent);
      if (attack) {
        attacks.push(attack);
      }
    }

    return attacks;
  }

  /**
   * Generate attack from combat talent
   */
  private generateTalentAttack(talent: TalentNode): Attack | null {
    // Only include talents that are attacks (have action cost and attack in description)
    if (talent.actionCost === ActionCostCode.Passive || 
        talent.actionCost === ActionCostCode.Special) {
      return null;
    }

    // Prefer structured attackDefinition if available
    if (talent.attackDefinition) {
      return this.generateAttackFromDefinition(talent);
    }

    // Fallback to text parsing (deprecated)
    const description = talent.description.toLowerCase();
    if (!description.includes('attack') && !description.includes('strike')) {
      return null;
    }

    console.warn(`[DEPRECATED] Talent '${talent.id}' is using text-based attack parsing. Please migrate to attackDefinition.`);
    
    // Parse talent description for attack details
    const attackDetails = this.parseTalentAttack(talent);
    if (!attackDetails) return null;

    return {
      id: `talent_${talent.id}`,
      name: talent.name,
      source: 'talent',
      talentId: talent.id,
      attackBonus: attackDetails.attackBonus,
      damage: attackDetails.damage,
      damageType: attackDetails.damageType,
      range: attackDetails.range,
      targetDefense: attackDetails.targetDefense,
      actionCost: typeof talent.actionCost === 'number' ? talent.actionCost : 1,
      // Surface surge/power effects as traits for visibility on attack cards
      traits: [
        ...(attackDetails.traits || []),
        ...((talent.otherEffects || []) as string[])
      ],
      description: talent.description,
      resourceCost: attackDetails.resourceCost,
    };
  }

  /**
   * Generate attack from structured attackDefinition
   */
  private generateAttackFromDefinition(talent: TalentNode): Attack | null {
    const def = talent.attackDefinition!;
    const tier = Math.floor((this.character.level - 1) / 5) + 1; // Calculate tier: 1-5, 6-10, 11-15, 16-20, 21+

    // Calculate attack bonus based on weapon type
    let attackBonus = 0;
    if (def.weaponType === 'light') {
      attackBonus = this.character.skills.calculateSkillTotal(SkillType.LIGHT_WEAPONRY, this.character.attributes);
    } else if (def.weaponType === 'heavy') {
      attackBonus = this.character.skills.calculateSkillTotal(SkillType.HEAVY_WEAPONRY, this.character.attributes);
    } else if (def.weaponType === 'unarmed') {
      attackBonus = this.character.skills.calculateSkillTotal(SkillType.ATHLETICS, this.character.attributes);
    } else {
      // For 'any', use best weapon skill
      const lightTotal = this.character.skills.calculateSkillTotal(SkillType.LIGHT_WEAPONRY, this.character.attributes);
      const heavyTotal = this.character.skills.calculateSkillTotal(SkillType.HEAVY_WEAPONRY, this.character.attributes);
      attackBonus = Math.max(lightTotal, heavyTotal);
    }

    // Get damage with tier scaling
    let damage = def.baseDamage || '0';
    if (def.damageScaling) {
      // Find the highest tier scaling that applies
      const applicableScaling = def.damageScaling
        .filter(s => tier >= s.tier)
        .sort((a, b) => b.tier - a.tier);
      if (applicableScaling.length > 0) {
        damage = applicableScaling[0].damage;
      }
    }

    // Build traits array
    const traits: string[] = [];
    if (def.specialMechanics) {
      def.specialMechanics.forEach(mechanic => {
        traits.push(mechanic);
      });
    }

    return {
      id: `talent_${talent.id}`,
      name: talent.name,
      source: 'talent',
      talentId: talent.id,
      attackBonus,
      damage,
      damageType: def.damageType || 'impact',
      range: this.formatRange(def.range),
      targetDefense: def.targetDefense,
      actionCost: typeof talent.actionCost === 'number' ? talent.actionCost : 1,
      resourceCost: def.resourceCost,
      traits,
      description: talent.description,
    };
  }

  /**
   * Format range for display
   */
  private formatRange(range: 'melee' | 'ranged' | 'special'): string {
    if (range === 'melee') return 'Melee';
    if (range === 'ranged') return 'Ranged';
    return 'Special';
  }

  /**
   * Parse talent description to extract attack details
   */
  private parseTalentAttack(talent: TalentNode): {
    attackBonus: number;
    damage: string;
    damageType: any;
    range: string;
    targetDefense: DefenseType;
    traits: string[];
    resourceCost?: { type: 'focus' | 'investiture'; amount: number };
  } | null {
    const desc = talent.description;

    // Determine defense type
    let targetDefense: DefenseType = 'Physical';
    if (desc.includes('Cognitive defense')) targetDefense = 'Cognitive';
    if (desc.includes('Spiritual defense')) targetDefense = 'Spiritual';

    // Determine range
    let range = 'Special';
    if (desc.includes('melee')) range = 'Melee';
    if (desc.includes('ranged')) range = 'Ranged';

    // Determine skill and attack bonus
    let attackBonus = 0;
    let weaponSkill = '';
    
    if (desc.includes('weapon attack')) {
      // Try to determine which weapon skill
      if (desc.includes('light weapon')) {
        weaponSkill = 'light-weaponry';
      } else if (desc.includes('melee weapon') || desc.includes('unarmed')) {
        // Could be either heavy or light, check character's better skill
        const lightTotal = this.character.skills.calculateSkillTotal(SkillType.LIGHT_WEAPONRY, this.character.attributes);
        const heavyTotal = this.character.skills.calculateSkillTotal(SkillType.HEAVY_WEAPONRY, this.character.attributes);
        const athleticsTotal = this.character.skills.calculateSkillTotal(SkillType.ATHLETICS, this.character.attributes);
        
        attackBonus = Math.max(lightTotal, heavyTotal, athleticsTotal);
      }
      
      if (weaponSkill) {
        const skillType = this.weaponSkillToSkillType(weaponSkill);
        attackBonus = this.character.skills.calculateSkillTotal(skillType, this.character.attributes);
      }
    }

    // If not a weapon attack, try surge skills (e.g., Cohesion, Tension, etc.)
    if (attackBonus === 0) {
      const surgeSkillMap: Array<{ key: string; type: SkillType }> = [
        { key: 'adhesion', type: SkillType.ADHESION },
        { key: 'gravitation', type: SkillType.GRAVITATION },
        { key: 'division', type: SkillType.DIVISION },
        { key: 'abrasion', type: SkillType.ABRASION },
        { key: 'illumination', type: SkillType.ILLUMINATION },
        { key: 'transformation', type: SkillType.TRANSFORMATION },
        { key: 'transportation', type: SkillType.TRANSPORTATION },
        { key: 'cohesion', type: SkillType.COHESION },
        { key: 'tension', type: SkillType.TENSION },
        { key: 'progression', type: SkillType.PROGRESSION }
      ];

      const descLower = desc.toLowerCase();
      const matched = surgeSkillMap.find(s => descLower.includes(`${s.key} attack`) || descLower.includes(`using ${s.key}`));
      if (matched) {
        attackBonus = this.character.skills.calculateSkillTotal(matched.type, this.character.attributes);
      }
    }

    // Parse damage from description and tier scaling
    const damage = this.parseTalentDamage(talent);

    // Parse resource cost (focus or investiture)
    let resourceCost;
    const focusMatch = desc.match(/spend\s+(\d+)\s+focus/i);
    const investMatch = desc.match(/spend\s+(\d+)\s+investiture/i);
    if (focusMatch) {
      resourceCost = { type: 'focus' as const, amount: parseInt(focusMatch[1]) };
    } else if (investMatch) {
      resourceCost = { type: 'investiture' as const, amount: parseInt(investMatch[1]) };
    }

    return {
      attackBonus,
      damage,
      damageType: 'impact', // Default, could be parsed from description
      range,
      targetDefense,
      traits: [],
      resourceCost,
    };
  }

  /**
   * Parse damage dice from talent description with tier scaling
   */
  private parseTalentDamage(talent: TalentNode): string {
    const desc = talent.description;
    const tier = this.character.level; // Approximate tier from level
    
    // Common patterns:
    // "add an extra 2d8 damage" with tier scaling
    // "add 4d4 damage" (6d4 at tier 3, 8d4 at tier 4, 10d4 at tier 5)
    
    // Fatal Thrust pattern: 4d4, 6d4, 8d4, 10d4
    if (talent.id === 'fatal_thrust') {
      const baseDice = tier >= 5 ? 10 : tier >= 4 ? 8 : tier >= 3 ? 6 : 4;
      return `${baseDice}d4`;
    }
    
    // Devastating Blow pattern: 2d8, 3d8, 4d8, 5d8
    if (talent.id === 'devastating_blow') {
      const numDice = tier >= 5 ? 5 : tier >= 4 ? 4 : tier >= 3 ? 3 : 2;
      return `${numDice}d8`;
    }
    
    // Generic damage parsing
    const damageMatch = desc.match(/(\d+)d(\d+) damage/i);
    if (damageMatch) {
      return `${damageMatch[1]}d${damageMatch[2]}`;
    }

    return '0';
  }

  /**
   * Get combined weapon+talent attacks
   * (e.g., basic weapon attack enhanced by Mighty talent)
   */
  private getCombinedAttacks(): Attack[] {
    // For now, we handle this through the weapon attacks with modifiers
    // Future: could create explicit combined attacks for clarity
    return [];
  }

  /**
   * Get trait grants from talents that apply to a specific weapon
   */
  private getTraitGrantsForWeapon(weapon: InventoryItem): string[] {
    const traits: string[] = [];
    const weaponId = weapon.id;
    
    // Get the base item ID (remove quantity suffixes like "-1", "-2", etc.)
    const baseWeaponId = weaponId.split('-')[0];
    
    // Iterate through all unlocked talents
    const unlockedTalents = Array.from(this.character.unlockedTalents)
      .map(id => this.allTalents.get(id))
      .filter(t => t !== undefined) as TalentNode[];

    for (const talent of unlockedTalents) {
      if (!talent.traitGrants) continue;

      for (const grant of talent.traitGrants) {
        // Check if this grant applies to the current weapon
        const appliesTo = this.traitGrantAppliesToWeapon(grant, baseWeaponId, weapon);
        if (appliesTo) {
          // Check if expert traits are required and character has the expertise
          if (grant.expert) {
            const hasExpertise = this.characterHasExpertiseForItem(baseWeaponId, weapon.name);
            if (hasExpertise) {
              traits.push(...grant.traits);
            }
          } else {
            // Non-expert traits are always added
            traits.push(...grant.traits);
          }
        }
      }
    }

    return traits;
  }

  /**
   * Check if a trait grant applies to a specific weapon
   */
  private traitGrantAppliesToWeapon(
    grant: any, // TraitGrant type
    weaponId: string,
    weapon: InventoryItem
  ): boolean {
    const targetItems = grant.targetItems;

    // Handle different target item formats
    if (Array.isArray(targetItems)) {
      // Check if weapon ID matches any of the target item IDs
      return targetItems.includes(weaponId) || targetItems.includes(weapon.name.toLowerCase());
    }

    if (targetItems === 'all') {
      return true;
    }

    // Handle category targets { category: 'string' }
    if (typeof targetItems === 'object' && targetItems.category) {
      // For now, just return false - category matching would need item categorization
      return false;
    }

    return false;
  }

  /**
   * Check if character has the appropriate expertise for a specific item
   * Maps item IDs to required expertise names for trait grants
   */
  private characterHasExpertiseForItem(itemId: string, itemName: string): boolean {
    // Map item IDs to required expertises for trait grants
    const itemExpertiseMap: Record<string, string> = {
      'knife': 'Knives',
      'sling': 'Slings',
      'axe': 'Heavy Weaponry',
      'sword': 'Light Weaponry',
      // Add more mappings as needed for other talents' trait grants
    };

    const expertise = itemExpertiseMap[itemId] || itemExpertiseMap[itemName.toLowerCase()];
    if (!expertise) {
      // If no mapping exists, default to checking if item has weapon properties
      // and the character has any weapon expertise
      return this.character.hasExpertise('Light Weaponry') || 
             this.character.hasExpertise('Heavy Weaponry') ||
             this.character.hasExpertise('Special Weapons');
    }

    return this.character.hasExpertise(expertise);
  }

  /**
   * Calculate Mighty talent damage bonus
   */
  private getMightyDamageBonus(): number {
    if (this.character.unlockedTalents.has('mighty')) {
      // Use the bonus manager with formula evaluation
      const context = {
        tier: Math.ceil(this.character.level / 4),
        skillRanks: this.buildSkillRanksMap()
      };
      const bonus = this.character.bonuses.bonuses.evaluateBonus(
        { type: BonusType.SKILL, target: 'attack', formula: '1 + tier' },
        context
      );
      return bonus;
    }
    return 0;
  }

  /**
   * Get ranged weapon bonuses from talents (e.g., Steady Aim)
   * Returns both the damage bonus value and formatted modifier info
   */
  private getRangedBonusesForWeapon(range: string): { damageBonus: number; modifiers: AttackModifier[] } {
    const modifiers: AttackModifier[] = [];
    let damageBonus = 0;

    // Only apply to ranged weapons
    if (!range || !range.includes('Ranged')) {
      return { damageBonus: 0, modifiers: [] };
    }

    // Check for Steady Aim bonus (perception.ranks)
    if (this.character.unlockedTalents.has('steady_aim')) {
      const context = {
        tier: Math.ceil(this.character.level / 4),
        skillRanks: this.buildSkillRanksMap()
      };
      const bonus = this.character.bonuses.bonuses.evaluateBonus(
        { type: BonusType.SKILL, target: 'ranged_damage', formula: 'perception.ranks', condition: 'on ranged weapon hit' },
        context
      );
      if (bonus > 0) {
        damageBonus += bonus;
        modifiers.push({
          source: 'steady_aim',
          type: 'damage',
          value: bonus,
          description: `Steady Aim: +${bonus} damage (Perception ranks)`,
          condition: 'on ranged weapon hit'
        });
      }
    }

    return { damageBonus, modifiers };
  }

  /**
   * Build skill ranks map for bonus formula evaluation
   */
  private buildSkillRanksMap(): Map<string, number> {
    const map = new Map<string, number>();
    map.set('perception', this.character.skills.getSkillRank(SkillType.PERCEPTION));
    map.set('athletics', this.character.skills.getSkillRank(SkillType.ATHLETICS));
    map.set('agility', this.character.skills.getSkillRank(SkillType.AGILITY));
    map.set('stealth', this.character.skills.getSkillRank(SkillType.STEALTH));
    map.set('discipline', this.character.skills.getSkillRank(SkillType.DISCIPLINE));
    map.set('intimidation', this.character.skills.getSkillRank(SkillType.INTIMIDATION));
    return map;
  }

  /**
   * Format damage string with modifiers
   */
  private formatDamage(baseDamage: string, modifier: number): string {
    if (modifier > 0) {
      return `${baseDamage}+${modifier}`;
    }
    return baseDamage;
  }

  /**
   * Determine defense type from weapon skill
   */
  private getWeaponDefenseType(skill: string): DefenseType {
    // Most weapon attacks target Physical defense
    return 'Physical';
  }

  /**
   * Get available stances from unlocked talents
   */
  getAvailableStances(): Stance[] {
    const stances: Stance[] = [];
    const stanceTalents = Array.from(this.character.unlockedTalents)
      .map(id => this.allTalents.get(id))
      .filter(t => t && t.name.toLowerCase().includes('stance')) as TalentNode[];

    for (const talent of stanceTalents) {
      const stance = this.generateStance(talent);
      if (stance) {
        stances.push(stance);
      }
    }

    return stances;
  }

  /**
   * Generate stance from talent
   */
  private generateStance(talent: TalentNode): Stance | null {
    const effects = talent.otherEffects || [];
    
    return {
      id: talent.id,
      name: talent.name,
      description: talent.description,
      talentId: talent.id,
      activationCost: 1, // Stances typically cost 1 action to enter
      effects,
    };
  }
}
