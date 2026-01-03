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
  private _selectedExpertises: ExpertiseSource[] = [];
  unlockedTalents: Set<string> = new Set<string>();

  private skillManager = new SkillManager();
  private derivedAttributesManager = new DerivedAttributesManager();
  private defenseManager = new DefenseManager();
  private resourceManager: ResourceManager;
  private bonusManager = new BonusManager();
  private radiantPathManager = new RadiantPathManager();
  private inventoryManager = new InventoryManager();
  private craftingManager: CraftingManager;
  
  /**
   * Performance cache: Set of expertise names for O(1) lookup
   * Invalidated when selectedExpertises changes
   * @private
   */
  private expertiseCache: Set<string> | null = null;

  /**
   * Get the character's expertises
   * Direct array access - modifications won't invalidate cache
   * Use addExpertise/removeExpertise methods or call invalidateExpertiseCache() after manual changes
   */
  get selectedExpertises(): ExpertiseSource[] {
    return this._selectedExpertises;
  }

  /**
   * Set the character's expertises
   * Automatically invalidates cache when array is replaced
   */
  set selectedExpertises(value: ExpertiseSource[]) {
    this._selectedExpertises = value;
    this.invalidateExpertiseCache();
  }

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
   * @returns Array of expertise names the character possesses
   */
  getExpertiseSkills(): string[] {
    return this.selectedExpertises.map(e => e.name);
  }

  /**
   * Check if character has a specific expertise
   * Uses cached Set for O(1) lookup performance
   * Cache is rebuilt if selectedExpertises array changes
   * @param expertiseName - Name of the expertise to check
   * @returns True if character has the expertise, false otherwise
   */
  hasExpertise(expertiseName: string): boolean {
    // Always check if cache needs rebuilding
    const currentExpertiseCount = this._selectedExpertises.length;
    const cacheSize = this.expertiseCache?.size ?? -1;
    
    // Rebuild cache if array length changed (detects push/splice/etc)
    if (!this.expertiseCache || cacheSize !== currentExpertiseCount) {
      this.rebuildExpertiseCache();
    }
    
    return this.expertiseCache!.has(expertiseName);
  }

  /**
   * Get expertise rank for skill checks
   * Currently all expertises have rank 1, but this allows for future expansion
   * @param expertiseName - Name of the expertise
   * @returns 1 if character has expertise, 0 otherwise
   */
  getExpertiseRank(expertiseName: string): number {
    return this.hasExpertise(expertiseName) ? 1 : 0;
  }

  /**
   * Rebuild the expertise cache from selectedExpertises array
   * Called automatically when cache is invalidated
   * @private
   */
  private rebuildExpertiseCache(): void {
    this.expertiseCache = new Set(this.selectedExpertises.map(e => e.name));
  }

  /**
   * Invalidate expertise cache
   * Call this whenever selectedExpertises array is modified
   * Cache will be rebuilt on next hasExpertise() call
   */
  invalidateExpertiseCache(): void {
    this.expertiseCache = null;
  }

}
