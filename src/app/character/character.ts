import { Attributes } from './attributes/attributes';
import { SkillManager } from './skills/skillManager';
import { DerivedAttributesManager } from './attributes/derivedAttributes/derivedAttributesManager';
import { DefenseManager } from './defenses/defenseManager';
import { ResourceManager } from './resources/resourceManager';
import { BonusManager } from './bonuses/bonusManager';
import { Ancestry } from './ancestry/ancestry';
import { CulturalInterface } from './culture/culturalInterface';
import { RadiantPathManager } from './radiantPath/radiantPathManager';
import { InventoryManager } from './inventory/inventoryManager';
import { CraftingManager } from './crafting/craftingManager';
import { ExpertiseSource } from './expertises/expertiseSource';


export class Character {

  name: string = '';
  level: number = 1;
  paths: string[] = [];
  ancestry: Ancestry | null = null;
  attributes: Attributes;
  cultures: CulturalInterface[] = [];
  selectedExpertises: ExpertiseSource[] = [];
  unlockedTalents: Set<string> = new Set<string>();

  private skillManager = new SkillManager();
  private derivedAttributesManager = new DerivedAttributesManager();
  private defenseManager = new DefenseManager();
  private resourceManager: ResourceManager;
  private bonusManager = new BonusManager();
  private radiantPathManager = new RadiantPathManager();
  private inventoryManager = new InventoryManager();
  private craftingManager: CraftingManager;

  constructor() {
    this.attributes = new Attributes();
    this.resourceManager = new ResourceManager(this.attributes);
    this.bonusManager.setCharacter(this);
    this.inventoryManager.setBonusManager(this.bonusManager);
    this.inventoryManager.setCharacter(this);
    this.craftingManager = new CraftingManager(this);
  }

  get skills(): SkillManager {
    return this.skillManager;
  }

  get derivedAttributes(): DerivedAttributesManager {
    return this.derivedAttributesManager;
  }

  get defenses(): DefenseManager {
    return this.defenseManager;
  }

  get resources(): ResourceManager {
    return this.resourceManager;
  }

  get bonuses(): BonusManager {
    return this.bonusManager;
  }

  get radiantPath(): RadiantPathManager {
    return this.radiantPathManager;
  }

  get inventory(): InventoryManager {
    return this.inventoryManager;
  }

  get crafting(): CraftingManager {
    return this.craftingManager;
  }

  /**
   * Get all expertise names (for skill checks)
   * Expertises function as skills with Intellect as the governing attribute
   */
  getExpertiseSkills(): string[] {
    return this.selectedExpertises.map(e => e.name);
  }

  /**
   * Check if character has a specific expertise
   */
  hasExpertise(expertiseName: string): boolean {
    return this.selectedExpertises.some(e => e.name === expertiseName);
  }

  /**
   * Get expertise rank for skill checks
   * Currently all expertises have rank 1, but this allows for future expansion
   */
  getExpertiseRank(expertiseName: string): number {
    return this.hasExpertise(expertiseName) ? 1 : 0;
  }

}
