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
import { TalentNode } from './talents/talentInterface';

// Import new character modules
import {
  IdentityModule,
  ProgressionModule,
  AncestryModule,
  TalentsModule,
  ExpertisesModule,
  SingerFormsModule,
  CombatModule,
  MetadataModule
} from './modules';


export class Character {
  // ============================================================================
  // MODULE 1: IDENTITY - Character identification
  // ============================================================================
  readonly identity: IdentityModule = new IdentityModule();

  // Backward compatibility getters/setters
  get id(): string { return this.identity.id; }
  set id(value: string) { this.identity.id = value; }
  get name(): string { return this.identity.name; }
  set name(value: string) { this.identity.name = value; }

  // ============================================================================
  // MODULE 2: PROGRESSION - Experience and level tracking
  // ============================================================================
  readonly progression: ProgressionModule = new ProgressionModule();

  // Backward compatibility getters/setters
  get level(): number { return this.progression.level; }
  set level(value: number) { this.progression.level = value; }
  get pendingLevelPoints(): number { return this.progression.pendingLevelPoints; }
  set pendingLevelPoints(value: number) { this.progression.pendingLevelPoints = value; }
  get pendingLevel(): boolean { return this.progression.pendingLevel; }
  set pendingLevel(value: boolean) { this.progression.pendingLevel = value; }

  // ============================================================================
  // MODULE 3: ANCESTRY/CULTURE - Character background and heritage
  // ============================================================================
  readonly ancestryModule: AncestryModule = new AncestryModule();

  // Backward compatibility getters/setters
  get ancestry(): Ancestry | null { return this.ancestryModule.ancestry; }
  set ancestry(value: Ancestry | null) { this.ancestryModule.ancestry = value; }
  get cultures(): CulturalInterface[] { return this.ancestryModule.cultures; }
  set cultures(value: CulturalInterface[]) { this.ancestryModule.cultures = value; }
  get paths(): string[] { return this.ancestryModule.paths; }
  set paths(value: string[]) { this.ancestryModule.paths = value; }

  // ============================================================================
  // MODULE 4: ATTRIBUTES - Core character statistics
  // ============================================================================
  attributes: Attributes;

  // ============================================================================
  // MODULE 5: SKILLS - Skill rankings and management
  // ============================================================================
  private skillManager = new SkillManager();

  // ============================================================================
  // MODULE 6: TALENTS - Talent selection and tracking
  // ============================================================================
  readonly talentsModule: TalentsModule = new TalentsModule();

  // Backward compatibility getters/setters
  get unlockedTalents(): Set<string> { return this.talentsModule.unlockedTalents; }
  set unlockedTalents(value: Set<string>) { this.talentsModule.unlockedTalents = value; }
  get baselineUnlockedTalents(): Set<string> | undefined { return this.talentsModule.baselineUnlockedTalents; }
  set baselineUnlockedTalents(value: Set<string> | undefined) { this.talentsModule.baselineUnlockedTalents = value; }

  // ============================================================================
  // MODULE 7: EXPERTISES - Specialized knowledge domains
  // ============================================================================
  readonly expertisesModule: ExpertisesModule = new ExpertisesModule();

  // Backward compatibility getters/setters
  private get _selectedExpertises(): ExpertiseSource[] { return this.expertisesModule.selectedExpertises; }
  private set _selectedExpertises(value: ExpertiseSource[]) { this.expertisesModule.selectedExpertises = value; }

  // ============================================================================
  // MODULE 8: RESOURCES - Health, Focus, and Investiture pools
  // ============================================================================
  private resourceManager: ResourceManager;

  // ============================================================================
  // MODULE 9: SINGER FORMS - Symbiotic form tracking and activation
  // ============================================================================
  readonly singerFormsModule: SingerFormsModule = new SingerFormsModule();

  // Backward compatibility getters/setters
  get unlockedSingerForms(): string[] { return this.singerFormsModule.unlockedSingerForms; }
  set unlockedSingerForms(value: string[]) { this.singerFormsModule.unlockedSingerForms = value; }
  get activeForm(): string | undefined { return this.singerFormsModule.activeForm; }
  set activeForm(value: string | undefined) { this.singerFormsModule.activeForm = value; }

  // ============================================================================
  // MODULE 10: COMBAT - Combat stance and attack system
  // ============================================================================
  readonly combatModule: CombatModule = new CombatModule();

  // Backward compatibility getters/setters
  get activeStanceId(): string | null { return this.combatModule.activeStanceId; }
  set activeStanceId(value: string | null) { this.combatModule.activeStanceId = value; }

  // ============================================================================
  // MODULE 11: INVENTORY - Items and equipment management
  // ============================================================================
  private inventoryManager = new InventoryManager();

  // ============================================================================
  // MODULE 12: BONUSES - Bonus tracking and application
  // ============================================================================
  private bonusManager = new BonusManager();

  // ============================================================================
  // MODULE 13: RADIANT PATH - Oath and ideal tracking for Radians
  // ============================================================================
  private radiantPathManager = new RadiantPathManager();

  // ============================================================================
  // MODULE 14: CRAFTING - Item creation and customization
  // ============================================================================
  private craftingManager: CraftingManager;

  // ============================================================================
  // MODULE 15: METADATA - Session and modification tracking
  // ============================================================================
  readonly metadataModule: MetadataModule = new MetadataModule();

  // Backward compatibility getters/setters
  get sessionNotes(): string { return this.metadataModule.sessionNotes; }
  set sessionNotes(value: string) { this.metadataModule.sessionNotes = value; }
  get lastModified(): string { return this.metadataModule.lastModified; }
  set lastModified(value: string) { this.metadataModule.lastModified = value; }

  // ============================================================================
  // INTERNAL MANAGERS (supporting calculations)
  // ============================================================================
  private derivedAttributesManager = new DerivedAttributesManager();
  private defenseManager = new DefenseManager();

  /**
   * Get the character's expertises
   * Direct array access - modifications won't invalidate cache
   * Use addExpertise/removeExpertise methods or call invalidateExpertiseCache() after manual changes
   */
  get selectedExpertises(): ExpertiseSource[] {
    return this.expertisesModule.selectedExpertises;
  }

  /**
   * Set the character's expertises
   * Automatically invalidates cache when array is replaced
   */
  set selectedExpertises(value: ExpertiseSource[]) {
    this.expertisesModule.selectedExpertises = value;
  }

  constructor() {
    this.attributes = new Attributes();
    this.resourceManager = new ResourceManager(this.attributes);
    this.bonusManager.setCharacter(this);
    this.inventoryManager.setBonusManager(this.bonusManager);
    this.inventoryManager.setCharacter(this);
    this.craftingManager = new CraftingManager(this);
    
    // Wire up module cross-references
    this.singerFormsModule.setBonusManager(this.bonusManager);
    this.combatModule.setCharacter(this);
  }

  // ============================================================================
  // PROGRESSION MODULE - Level and tier calculations
  // ============================================================================

  /**
   * Get the character's tier based on level.
   * Tier 1: levels 1-5
   * Tier 2: levels 6-10
   * Tier 3: levels 11-15
   * Tier 4: levels 16-20
   * Tier 5: level 21+
   */
  getTier(): number {
    return this.progression.getTier();
  }

  // ============================================================================
  // MODULE ACCESSORS - Expose manager instances
  // ============================================================================

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

  // ============================================================================
  // RESOURCES MODULE - Health, Focus, and Investiture management
  // ============================================================================

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

  // ============================================================================
  // RADIANT PATH MODULE - Universal abilities from Radiant Oaths
  // ============================================================================

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

  // ============================================================================
  // SINGER FORMS MODULE - Symbiotic form tracking and management
  // ============================================================================

  // ============================================================================
  // SINGER FORMS MODULE - Symbiotic form tracking and management
  // ============================================================================

  /**
   * Unlock a Singer form
   * @param formId - The ID of the form to unlock (e.g., 'nimbleform', 'artform')
   */
  unlockSingerForm(formId: string): void {
    this.singerFormsModule.unlockForm(formId);
  }

  /**
   * Check if character has unlocked a specific Singer form
   */
  hasSingerForm(formId: string): boolean {
    return this.singerFormsModule.hasForm(formId);
  }

  /**
   * Set the active Singer form
   * @param formId - ID of the form to activate, or undefined to clear
   * @throws Error if trying to set a form that hasn't been unlocked
   */
  setActiveForm(formId: string | undefined): void {
    this.singerFormsModule.setActiveForm(formId);
  }

  /**
   * Get list of available Singer forms for selection
   */
  getAvailableForms(): UniversalAbility[] {
    return this.singerFormsModule.getAvailableForms();
  }

  /**
   * Get bonuses from the currently active form
   */
  getActiveFormBonuses(): BonusEffect[] {
    return this.singerFormsModule.getActiveFormBonuses();
  }

  /**
   * Get information about the active form
   */
  getActiveFormInfo(): UniversalAbility | undefined {
    return this.singerFormsModule.getActiveFormInfo();
  }

  // ============================================================================
  // EXPERTISES MODULE - Specialized knowledge domains
  // ============================================================================

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
    return this.expertisesModule.hasExpertise(expertiseName);
  }

  /**
   * Get expertise rank for skill checks
   * Currently all expertises have rank 1, but this allows for future expansion
   * @param expertiseName - Name of the expertise
   * @returns 1 if character has expertise, 0 otherwise
   */
  getExpertiseRank(expertiseName: string): number {
    return this.expertisesModule.getExpertiseRank(expertiseName);
  }

  // ============================================================================
  // COMBAT MODULE - Combat stance and attack system
  // ============================================================================

  /**
   * Get all available attacks for combat
   * Combines equipped weapons and combat talents
   */
  getAvailableAttacks(): Attack[] {
    return this.combatModule.getAvailableAttacks();
  }

  /**
   * Get available combat stances
   */
  getAvailableStances(): Stance[] {
    return this.combatModule.getAvailableStances();
  }

  /**
   * Set the active combat stance
   * @param stanceId - The ID of the stance to activate, or null to deactivate
   * @returns true if the stance was successfully set, false otherwise
   */
  setActiveStance(stanceId: string | null): boolean {
    return this.combatModule.setActiveStance(stanceId);
  }

  /**
   * Get the currently active stance, if any
   * @returns The active Stance object, or null if no stance is active
   */
  getActiveStance(): Stance | null {
    return this.combatModule.getActiveStance();
  }

  /**
   * Apply bonuses from a stance
   * Extracts the bonus array from the talent node and applies to bonus module with source "stance:{stanceId}"
   * @param stanceId - The ID of the stance
   * @param talentNode - The talent node containing the stance bonuses
   */
  applyStanceBonuses(stanceId: string, talentNode: TalentNode): void {
    this.combatModule.applyStanceBonuses(stanceId, talentNode);
  }

  /**
   * Clear all bonuses from the current active stance
   * Removes bonuses with source pattern "stance:{activeStanceId}"
   */
  clearStanceBonuses(): void {
    this.combatModule.clearStanceBonuses();
  }

}
