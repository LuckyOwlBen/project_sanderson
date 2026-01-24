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
import { UniversalAbility, getSingerFormAbilities, SINGER_FORMS } from './abilities/universalAbilities';
import { BonusType, BonusEffect } from './bonuses/bonusModule';
import { AttackCalculator } from './attacks/attackCalculator';
import { Attack, Stance } from './attacks/attackInterfaces';


export class Character {
  id: string = '';
  name: string = '';
  level: number = 1;
  pendingLevelPoints: number = 0; // Track levels that haven't been spent yet
  paths: string[] = [];
  ancestry: Ancestry | null = null;
  attributes: Attributes;
  cultures: CulturalInterface[] = [];
  private _selectedExpertises: ExpertiseSource[] = [];
  unlockedTalents: Set<string> = new Set<string>();
  baselineUnlockedTalents?: Set<string>; // Talents unlocked before current level-up session
  
  // Singer forms tracking - stores IDs of unlocked forms
  unlockedSingerForms: string[] = [];
  
  // Active Singer form - the form currently granting bonuses
  activeForm?: string;

  // Combat stance tracking - stores the ID of the currently active stance
  activeStanceId: string | null = null;

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

  /**
   * Get the character's tier based on level.
   * Tier 1: levels 1-5
   * Tier 2: levels 6-10
   * Tier 3: levels 11-15
   * Tier 4: levels 16-20
   * Tier 5: level 21+
   */
  getTier(): number {
    const lvl = this.level || 1;
    if (lvl <= 5) return 1;
    if (lvl <= 10) return 2;
    if (lvl <= 15) return 3;
    if (lvl <= 20) return 4;
    return 5;
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
   * Unlock investiture - called when character speaks first ideal and has bonded spren
   * Investiture should only be unlocked after both conditions are met
   */
  unlockInvestiture(): void {
    if (this.radiantPathManager.hasSpren() && this.radiantPathManager.hasSpokenIdeal()) {
      this.resourceManager.investiture.unlock();
    }
  }

  /**
   * Recalculate all resource max values based on current attributes and bonuses
   * Should be called after attribute changes or bonuses are added/removed
   */
  recalculateResources(): void {
    // Get investiture bonus from bonus system (investiture-max target in RESOURCE type)
    const investitureBonus = this.bonusManager.bonuses.getBonusesFor(BonusType.RESOURCE, 'investiture-max');
    
    // Recalculate base resources
    this.resourceManager.recalculateMaxValues(this.attributes);
    
    // Apply investiture bonus separately if active
    if (this.resourceManager.investiture.isActive()) {
      this.resourceManager.investiture.recalculateMax(this.attributes, investitureBonus);
    }
  }

  /**
   * Restore investiture to full - called between encounters
   * Players restore investiture between encounters
   */
  restoreInvestitureBetweenEncounters(): void {
    this.resourceManager.investiture.restoreFully();
  }

  /**
   * Get all universal abilities available to this character
   * Includes Radiant abilities and any other special one-off abilities
   */
  getUniversalAbilities(): UniversalAbility[] {
    const abilities: UniversalAbility[] = [];
    
    // Get Radiant universal abilities if applicable
    abilities.push(...this.radiantPathManager.getUniversalAbilities());
    
    // Get Singer form abilities if applicable
    abilities.push(...getSingerFormAbilities(this.unlockedSingerForms));
    
    // Future: Add abilities from other sources
    // - Special items (e.g., Shardplate)
    // - Conditions
    // - Special rules
    
    return abilities;
  }

  /**
   * Unlock a Singer form
   * @param formId - The ID of the form to unlock (e.g., 'nimbleform', 'artform')
   */
  unlockSingerForm(formId: string): void {
    if (!this.unlockedSingerForms.includes(formId)) {
      this.unlockedSingerForms.push(formId);
    }
  }

  /**
   * Check if character has unlocked a specific Singer form
   */
  hasSingerForm(formId: string): boolean {
    return this.unlockedSingerForms.includes(formId);
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

  /**
   * Set the active Singer form
   * @param formId - ID of the form to activate, or undefined to clear
   * @throws Error if trying to set a form that hasn't been unlocked
   */
  setActiveForm(formId: string | undefined): void {
    // If clearing the form
    if (formId === undefined) {
      this.clearActiveFormBonuses();
      this.activeForm = undefined;
      return;
    }

    // Validate that the form is unlocked (dullform is always available)
    if (formId !== 'dullform' && !this.hasSingerForm(formId)) {
      throw new Error(`Cannot activate form "${formId}" - it has not been unlocked`);
    }

    // Clear previous form bonuses
    this.clearActiveFormBonuses();

    // Set new active form
    this.activeForm = formId;

    // Apply new form bonuses
    this.applyActiveFormBonuses();
  }

  /**
   * Get list of available Singer forms for selection
   */
  getAvailableForms(): UniversalAbility[] {
    // Dullform is always available for Singers
    return SINGER_FORMS.filter(form => 
      form.id === 'dullform' || this.hasSingerForm(form.id)
    );
  }

  /**
   * Get bonuses from the currently active form
   */
  getActiveFormBonuses(): BonusEffect[] {
    if (!this.activeForm) {
      return [];
    }

    // Return the bonuses for the active form source
    const source = this.getActiveFormSource();
    // BonusModule doesn't expose a way to get bonuses by source, so we'll track them ourselves
    const bonuses: BonusEffect[] = [];
    
    // Retrieve form info to determine which bonuses should be active
    const formInfo = this.getActiveFormInfo();
    if (!formInfo) {
      return [];
    }

    // We need to build the list from what we know we applied
    // This is a limitation of the current BonusModule design
    // For now, return indication that bonuses are active
    switch (this.activeForm) {
      case 'dullform':
        // Dullform provides no bonuses
        return [];
      case 'nimbleform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'agility', value: 1 });
        break;
      case 'artform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'presence', value: 1 });
        break;
      case 'meditationform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'willpower', value: 1 });
        break;
      case 'scholarform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'intellect', value: 1 });
        break;
      case 'warform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'strength', value: 2 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'vitality', value: 1 });
        break;
      case 'workform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'strength', value: 1 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'vitality', value: 1 });
        break;
      case 'direform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'strength', value: 1 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'agility', value: 1 });
        break;
      case 'stormform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'strength', value: 2 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'vitality', value: 2 });
        break;
      case 'decayform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'vitality', value: 1 });
        break;
      case 'envoyform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'presence', value: 2 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'intellect', value: 1 });
        break;
      case 'nightform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'agility', value: 2 });
        break;
      case 'relayform':
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'intellect', value: 1 });
        bonuses.push({ type: BonusType.ATTRIBUTE, target: 'willpower', value: 1 });
        break;
    }

    return bonuses;
  }

  /**
   * Get information about the active form
   */
  getActiveFormInfo(): UniversalAbility | undefined {
    if (!this.activeForm) {
      return undefined;
    }

    return SINGER_FORMS.find(f => f.id === this.activeForm);
  }

  /**
   * Get source string for active form bonuses
   * @private
   */
  private getActiveFormSource(): string {
    return `activeform:${this.activeForm}`;
  }

  /**
   * Apply bonuses from the currently active form
   * @private
   */
  private applyActiveFormBonuses(): void {
    if (!this.activeForm) {
      return;
    }

    const form = SINGER_FORMS.find(f => f.id === this.activeForm);
    if (!form) {
      return;
    }

    const source = this.getActiveFormSource();

    switch (this.activeForm) {
      case 'nimbleform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'agility', value: 1 });
        break;
      case 'artform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'presence', value: 1 });
        break;
      case 'meditationform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'willpower', value: 1 });
        break;
      case 'scholarform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'intellect', value: 1 });
        break;
      case 'warform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'strength', value: 2 });
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'vitality', value: 1 });
        break;
      case 'workform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'strength', value: 1 });
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'vitality', value: 1 });
        break;
      case 'direform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'strength', value: 1 });
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'agility', value: 1 });
        break;
      case 'stormform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'strength', value: 2 });
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'vitality', value: 2 });
        break;
      case 'decayform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'vitality', value: 1 });
        break;
      case 'envoyform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'presence', value: 2 });
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'intellect', value: 1 });
        break;
      case 'nightform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'agility', value: 2 });
        break;
      case 'relayform':
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'intellect', value: 1 });
        this.bonusManager.bonuses.addBonus(source, { type: BonusType.ATTRIBUTE, target: 'willpower', value: 1 });
        break;
    }
  }

  /**
   * Clear bonuses from active form
   * @private
   */
  private clearActiveFormBonuses(): void {
    if (this.activeForm) {
      const source = this.getActiveFormSource();
      this.bonusManager.bonuses.removeBonus(source);
    }
  }

  /**
   * Get all available attacks for combat
   * Combines equipped weapons and combat talents
   */
  getAvailableAttacks(): Attack[] {
    const calculator = new AttackCalculator(this);
    return calculator.getAvailableAttacks();
  }

  /**
   * Get available combat stances
   */
  getAvailableStances(): Stance[] {
    const calculator = new AttackCalculator(this);
    return calculator.getAvailableStances();
  }

  /**
   * Set the active combat stance
   * @param stanceId - The ID of the stance to activate, or null to deactivate
   * @returns true if the stance was successfully set, false otherwise
   */
  setActiveStance(stanceId: string | null): boolean {
    if (stanceId === null) {
      this.activeStanceId = null;
      return true;
    }

    // Verify the stance exists and is available
    const availableStances = this.getAvailableStances();
    const stanceExists = availableStances.some(s => s.id === stanceId);

    if (!stanceExists) {
      console.warn(`Stance with ID "${stanceId}" is not available for this character`);
      return false;
    }

    this.activeStanceId = stanceId;
    return true;
  }

  /**
   * Get the currently active stance, if any
   * @returns The active Stance object, or null if no stance is active
   */
  getActiveStance(): Stance | null {
    if (!this.activeStanceId) {
      return null;
    }

    const availableStances = this.getAvailableStances();
    return availableStances.find(s => s.id === this.activeStanceId) || null;
  }

  /**
   * Apply bonuses from a stance
   * Extracts the bonus array from the talent node and applies to bonus module with source "stance:{stanceId}"
   * @param stanceId - The ID of the stance
   * @param talentNode - The talent node containing the stance bonuses
   */
  applyStanceBonuses(stanceId: string, talentNode: any): void {
    // Build source identifier for stance bonuses
    const source = `stance:${stanceId}`;

    // Apply all bonuses from the talent node
    if (talentNode.bonuses && talentNode.bonuses.length > 0) {
      talentNode.bonuses.forEach((bonus: any) => {
        this.bonusManager.bonuses.addBonus(source, bonus);
      });
    }
  }

  /**
   * Clear all bonuses from the current active stance
   * Removes bonuses with source pattern "stance:{activeStanceId}"
   */
  clearStanceBonuses(): void {
    if (this.activeStanceId) {
      const source = `stance:${this.activeStanceId}`;
      this.bonusManager.bonuses.removeBonus(source);
    }
  }

}
