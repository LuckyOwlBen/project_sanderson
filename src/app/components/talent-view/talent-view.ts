/**
 * TalentView Component - PHASE 3 REFACTOR
 *
 * SIMPLIFIED ARCHITECTURE:
 * - Single API call: getTalentUI() returns all needed data
 * - No local calculations: backend handles all point logic, tier 0 costs, availability
 * - Frontend is display + input layer only
 * - All talent processing pushed to backend
 *
 * Data flow:
 * 1. Component loads TalentUIResponse (keywords, points available, unlocked talents)
 * 2. Template displays talents from talentKeywords
 * 3. User selects talent → backend processes, returns new TalentUIResponse
 * 4. Component updates state from response
 */

import {
  Component,
  OnInit,
  OnDestroy,
  Output,
  EventEmitter,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, filter, take } from 'rxjs';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { CharacterStorageService } from '../../services/character-storage.service';
import { Character } from '../../character/character';
import { TalentNode, TalentUIResponse } from '../../../../shared/types/talents';
import { TalentPrerequisiteChecker } from '../../character/talents/talentPrerequesite';
import talentTreeManager from '../../../../shared/data/talents/talentManager';
import { StepValidationService } from '../../services/step-validation.service';
import { WebsocketService, SprenGrantEvent } from '../../services/websocket.service';
import { TalentsApiService } from '../../services/talents-api.service';
import { TalentEffectParser } from '../../character/talents/talentEffectParser';
import { applyTalentEffects } from '../../character/talents/talentEffects';
import {
  ExpertiseChoiceDialog,
  ExpertiseChoiceData,
} from '../shared/expertise-choice-dialog/expertise-choice-dialog';

@Component({
  selector: 'app-talent-view',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './talent-view.html',
  styleUrl: './talent-view.scss',
})
export class TalentView implements OnInit, OnDestroy {
  @Output() pendingChange = new EventEmitter<boolean>();

  private destroy$ = new Subject<void>();
  private readonly STEP_INDEX = 7;

  // Minimal state from API response
  talentUIState: TalentUIResponse | null = null;
  character: Character | null = null;
  isLoading: boolean = false;
  validationMessage: string = '';
  pendingSprenGrant: SprenGrantEvent | null = null;
  isLevelUpMode: boolean = false;

  private characterId: string | null = null;

  // Template compatibility properties (derived from talentUIState)
  get isLoadingTalentData(): boolean {
    return this.isLoading;
  }
  get availableTalentPoints(): number {
    return this.talentUIState?.pointsAvailable || 0;
  }
  get availableTrees(): any[] {
    return this.buildAvailableTreesFromKeywords();
  }
  get showCorePathSelector(): boolean {
    return (this.talentUIState?.bonusPathIds?.length || 0) > 0;
  }
  get availableCorePaths(): any[] {
    return this.buildBonusPathOptions();
  }
  selectedTree: any = null;
  cachedVisibleTalents: any[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private validationService: StepValidationService,
    private websocketService: WebsocketService,
    private dialog: MatDialog,
    private talentsApi: TalentsApiService,
    private identityService: CharacterIdentityService,
    private characterStorage: CharacterStorageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('[TalentView] ngOnInit called');

    // Subscribe to route params to detect level-up mode
    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.isLevelUpMode = params['levelUp'] === 'true';
    });

    // Load character and fetch talents UI state
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => id !== null)
      )
      .subscribe((characterId) => {
        if (characterId) {
          this.characterId = characterId;

          // Load character from storage
          this.characterStorage
            .loadCharacter(characterId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (character) => {
                console.log('[TalentView] Character loaded:', character?.id);
                this.character = character;
                if (this.character) {
                  // Load talent UI state from API
                  console.log(
                    '[TalentView] Calling loadTalentUIState for character:',
                    this.characterId
                  );
                  this.loadTalentUIState();
                }
              },
              error: (error) => console.error('[TalentView] Failed to load character:', error),
            });
        }
      });

    // Listen for spren grants
    this.websocketService.sprenGrant$.pipe(takeUntil(this.destroy$)).subscribe((grant) => {
      if (this.character && grant.characterId === (this.character as any).id) {
        this.pendingSprenGrant = grant;
        setTimeout(() => {
          if (this.pendingSprenGrant === grant) {
            this.pendingSprenGrant = null;
          }
        }, 30000);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load minimal talent UI state from backend
   * Backend handles all calculations, returns only display data
   */
  private loadTalentUIState(): void {
    if (!this.characterId) {
      console.log('[TalentView] loadTalentUIState - no characterId');
      return;
    }

    this.isLoading = true;
    console.log('[TalentView] Loading talent UI state for character:', this.characterId);

    this.talentsApi
      .getTalentUI(this.characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (state) => {
          console.log('[TalentView] API response received');
          this.talentUIState = state;
          this.isLoading = false;

          console.log('[TalentView] Loaded talent UI state:', {
            unlockedCount: state.unlockedTalentIds.length,
            pendingCount: state.pendingTalentIds.length,
            availableCount: state.availableTalentIds.length,
            pointsAvailable: state.pointsAvailable,
            unlockedTalentIds: state.unlockedTalentIds,
            pendingTalentIds: state.pendingTalentIds,
            availableTalentIds: state.availableTalentIds.slice(0, 10),
          });

          // Auto-select appropriate initial tree
          this.autoSelectInitialTree();

          this.updateValidation();
          this.updateVisibleTalentsCache();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[TalentView] API call failed - error:', err);
          console.error('[TalentView] Error details:', {
            message: err.message,
            status: err.status,
            statusText: err.statusText,
            url: err.url,
          });
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  /**
   * Persist step before navigation - calls finalize endpoint
   */
  public persistStep(): void {
    if (this.characterId) {
      // Backend already has all the pending selections
      // Just need to finalize when user clicks Next
    }
  }

  /**
   * Unlock a talent selected by user
   * Shows expertise dialog if needed, then calls backend
   */
  unlockTalent(talent: any): void {
    console.log('[TalentView] unlockTalent called with:', {
      talentId: talent.id,
      talentName: talent.name,
      pathId: talent.pathId,
    });

    if (!this.character) {
      console.log('[TalentView] unlockTalent - no character');
      return;
    }

    // Fetch static talent node definition from shared manager
    const entry = talentTreeManager.getTalentNodeById(talent.id);
    if (!entry || !entry.node) {
      console.log('[TalentView] unlockTalent - real talent node not found:', talent.id);
      return;
    }
    const realTalentNode = entry.node;
    if (!realTalentNode) {
      console.log('[TalentView] unlockTalent - real talent node not found:', talent.id);
      return;
    }

    // Check prerequisites locally for UX before sending to backend
    const checker = new TalentPrerequisiteChecker(
      this.character,
      new Set(this.talentUIState?.unlockedTalentIds || [])
    );
    if (!checker.canUnlockTalent(realTalentNode)) {
      console.log('[TalentView] unlockTalent - prerequisite check failed');
      return;
    }

    console.log('[TalentView] unlockTalent - prerequisites OK, proceeding with unlock');
    // Parse expertise grants from talent
    const expertiseGrants = TalentEffectParser.parseExpertiseGrantsFromTalent(realTalentNode);

    if (expertiseGrants.length > 0) {
      console.log('[TalentView] unlockTalent - has expertise grants, showing dialog');
      // Show dialog to collect expertise choices from user
      this.handleExpertiseGrants(realTalentNode, expertiseGrants, 0);
    } else {
      console.log('[TalentView] unlockTalent - no expertise grants, applying unlock directly');
      // No choices needed, unlock directly
      this.applyTalentUnlock(realTalentNode);
    }
  }

  private handleExpertiseGrants(talent: TalentNode, grants: any[], grantIndex: number): void {
    if (grantIndex >= grants.length) {
      this.applyTalentUnlock(talent);
      return;
    }

    const grant = grants[grantIndex];

    if (grant.type === 'single') {
      // Auto-grant single expertises
      grant.expertises.forEach((expertiseName: string) => {
        this.character!.bonuses.grantExpertise(talent.id, expertiseName);
      });
      this.handleExpertiseGrants(talent, grants, grantIndex + 1);
    } else if (grant.type === 'choice') {
      // Show dialog for choice
      const dialogRef = this.dialog.open(ExpertiseChoiceDialog, {
        width: '600px',
        panelClass: 'dark-dialog',
        data: {
          talentName: talent.name,
          options: grant.expertises,
          choiceCount: grant.choiceCount || 1,
          description: `Choose ${grant.choiceCount || 1} expertise${
            (grant.choiceCount || 1) > 1 ? 's' : ''
          } from this talent.`,
        } as ExpertiseChoiceData,
      });

      dialogRef.afterClosed().subscribe((result) => {
        if (result && result.selected) {
          result.selected.forEach((expertiseName: string) => {
            this.character!.bonuses.grantExpertise(talent.id, expertiseName);
          });
          this.handleExpertiseGrants(talent, grants, grantIndex + 1);
        }
      });
    }
  }

  private applyTalentUnlock(talent: TalentNode): void {
    console.log('[TalentView] applyTalentUnlock called for:', talent.id);

    if (!this.character || !this.characterId) {
      console.log('[TalentView] applyTalentUnlock - no character or characterId');
      return;
    }

    // Update local character for display
    this.character.unlockedTalents.add(talent.id);
    this.character.bonuses.unlockTalent(talent.id, talent);
    applyTalentEffects(this.character, talent.id);

    // Persist talents state to backend
    // Only send PENDING talents, not total (which are locked-in)
    const newPending = new Set(this.talentUIState?.pendingTalentIds || []);
    newPending.add(talent.id);

    console.log('[TalentView] applyTalentUnlock - sending to server:', {
      talentId: talent.id,
      newPendingTalents: Array.from(newPending),
    });

    this.talentsApi
      .saveTalents(this.characterId, {
        pendingTalents: Array.from(newPending),
      })
      .subscribe({
        next: () => {
          console.log(
            '[TalentView] applyTalentUnlock - server response received, reloading UI state'
          );
          // Reload UI state from backend with updated values
          this.loadTalentUIState();
          this.updateValidation();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[TalentView] Failed to save talent unlock:', err);
          this.talentUIState = null;
          this.loadTalentUIState();
        },
      });
  }

  /**
   * Remove talent selected by user
   */
  removeTalent(talentId: string): void {
    if (!this.character || !this.characterId) return;

    // Can only remove talents that are pending (selected this session)
    const isPending = this.talentUIState?.pendingTalentIds?.includes(talentId);
    if (!isPending) return;

    // Update local character
    this.character.unlockedTalents.delete(talentId);
    this.character.bonuses.bonuses.removeBonus(`talent:${talentId}`);
    this.character.bonuses.removeExpertisesByTalent(talentId);

    // Persist to backend - only modify PENDING talents
    const newPending = new Set(this.talentUIState?.pendingTalentIds || []);
    newPending.delete(talentId);

    this.talentsApi
      .saveTalents(this.characterId, {
        pendingTalents: Array.from(newPending),
      })
      .subscribe({
        next: () => {
          this.loadTalentUIState();
          this.updateValidation();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[TalentView] Failed to save talent removal:', err);
          this.talentUIState = null;
          this.loadTalentUIState();
        },
      });
  }

  isTalentUnlocked(talentId: string): boolean {
    return this.talentUIState?.unlockedTalentIds.includes(talentId) || false;
  }

  canRemoveTalent(talentId: string): boolean {
    // Can only remove talents that are pending (not baseline locked)
    return this.talentUIState?.pendingTalentIds?.includes(talentId) || false;
  }

  getVisibleTalents(): any[] {
    if (!this.talentUIState || !this.selectedTree || !this.selectedTree.nodes) {
      return [];
    }

    const filtered = this.selectedTree.nodes
      .filter(
        (talent: any) =>
          talent && talent.id && this.talentUIState!.availableTalentIds.includes(talent.id)
      )
      .map((talent: any) => ({
        ...talent,
        id: talent.id,
        pathId: this.selectedTree.mainPathId || this.selectedTree.pathName, // Use mainPathId from tree (which is 'agent' for specializations)
      }));

    return filtered;
  }

  formatPrerequisite(prereq: string | any): string {
    if (typeof prereq === 'string') {
      const talent = this.talentUIState?.talentKeywords[prereq];
      return talent?.name || prereq;
    }

    switch (prereq.type) {
      case 'talent':
        const talent = this.talentUIState?.talentKeywords[prereq.target];
        return talent?.name || prereq.target;

      case 'skill':
        const formattedSkill = this.formatSkillName(prereq.target);
        return `${formattedSkill} (Rank ${prereq.value || 1}+)`;

      case 'attribute':
        const formattedAttribute = prereq.target.charAt(0).toUpperCase() + prereq.target.slice(1);
        return `${formattedAttribute} ${prereq.value || 1}+`;

      case 'level':
        return `Level ${prereq.value || 1}+`;

      case 'ideal':
        const idealNames: Record<string, string> = {
          first: 'First Ideal',
          second: 'Second Ideal',
          third: 'Third Ideal',
          fourth: 'Fourth Ideal',
          fifth: 'Fifth Ideal',
        };
        return idealNames[prereq.target] || `${prereq.target} Ideal`;

      default:
        return String(prereq);
    }
  }

  private formatSkillName(skillType: string): string {
    return skillType
      .toLowerCase()
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Update validation message based on current state
   */
  private updateValidation(): void {
    if (!this.character || !this.talentUIState) {
      this.validationService.setStepValid(this.STEP_INDEX, false);
      return;
    }

    // In level-up mode: points must be fully spent
    if (this.isLevelUpMode) {
      const pointsSpent = this.talentUIState.pointsAvailable === 0;
      this.validationMessage = pointsSpent
        ? ''
        : `Select ${this.talentUIState.pointsAvailable} more talent(s)`;
      this.validationService.setStepValid(this.STEP_INDEX, pointsSpent);
      this.checkPendingStatus();
      return;
    }

    // Character creation mode: specific rules
    let isValid = true;
    if (this.talentUIState.requiresSingerSelection) {
      const hasSingerTalent = this.talentUIState.unlockedTalentIds.some((id) =>
        this.talentUIState!.talentKeywords[id]?.pathId?.includes('singer')
      );
      isValid = hasSingerTalent;
      this.validationMessage = isValid ? '' : 'Please select a Singer path talent first';
    } else {
      this.validationMessage = '';
    }

    this.validationService.setStepValid(this.STEP_INDEX, isValid);
    this.checkPendingStatus();
  }

  private checkPendingStatus(): void {
    const hasPending = (this.talentUIState?.pointsAvailable || 0) > 0;
    this.pendingChange.emit(hasPending);
  }

  acceptSpren(): void {
    if (!this.character || !this.pendingSprenGrant) return;

    // Grant the spren to the character
    this.character.radiantPath.grantSpren(this.pendingSprenGrant.order);
    this.pendingSprenGrant = null;

    // Reload to show radiant talents
    this.loadTalentUIState();
    this.updateValidation();
  }

  /**
   * Build TalentTree objects from talentKeywords for template compatibility
   * Fetches actual prerequisites from talent data
   */
  private buildAvailableTreesFromKeywords(): any[] {
    if (!this.talentUIState) return [];

    // Delegate grouping to shared manager — it attaches raw prerequisites but
    // does NOT compute unlocked/available state (backend responsibility)
    const displayTrees = talentTreeManager.buildDisplayTreesFromKeywords(
      this.talentUIState.talentKeywords || {}
    );

    // Map manager output to the UI-compatible shape expected by the template
    return displayTrees
      .map((dt) => ({
        pathName: dt.pathName,
        mainPathId: dt.key,
        nodes: dt.nodes.map((n: any) => ({
          id: n.id,
          name: (n.__keywords && n.__keywords.name) || n.name,
          description: (n.__keywords && n.__keywords.description) || n.description || '',
          tier: (n.__keywords && n.__keywords.tier) ?? n.tier,
          expertiseKeywords:
            (n.__keywords && n.__keywords.expertiseKeywords) || n.expertiseKeywords || [],
          prerequisites: n.prerequisites || [],
        })),
      }))
      .sort((a, b) => a.pathName.localeCompare(b.pathName));
  }

  /**
   * Build bonus path options for template
   */
  private buildBonusPathOptions(): any[] {
    if (!this.talentUIState) return [];

    return this.talentUIState.bonusPathIds.map((pathId) => {
      const talentPath = talentTreeManager.getTalentPath(pathId);
      const keyTalent = talentPath?.talentNodes?.find((t: TalentNode) => t.tier === 0);

      return {
        id: pathId,
        name: this.formatPathName(pathId),
        keyTalent: keyTalent || {
          id: 'unknown',
          name: this.formatPathName(pathId),
          description: 'Key talent not found',
        },
        isSelected: this.talentUIState?.selectedBonusPathIds.includes(pathId) || false,
      };
    });
  }

  private formatPathName(pathId: string): string {
    return pathId
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Select a tree for display
   */
  selectTree(tree: any): void {
    this.selectedTree = tree;
    this.updateVisibleTalentsCache();
  }

  private updateVisibleTalentsCache(): void {
    this.cachedVisibleTalents = this.getVisibleTalents();
  }

  /**
   * Check if a talent can be unlocked (checks prerequisites)
   */
  canUnlockTalent(talent: any): boolean {
    if (!this.character || !talent) return false;

    // Can't unlock if already unlocked
    const isUnlocked = this.isTalentUnlocked(talent.id);
    if (isUnlocked) {
      return false;
    }

    // Need points available
    if (this.availableTalentPoints <= 0) {
      return false;
    }

    // Check prerequisites locally
    const checker = new TalentPrerequisiteChecker(
      this.character,
      new Set(this.talentUIState?.unlockedTalentIds || [])
    );

    // Use real prerequisite data from talent definition
    const talentNode: TalentNode = {
      id: talent.id,
      name: talent.name,
      description: talent.description,
      tier: talent.tier,
      actionCost: 0,
      prerequisites: talent.prerequisites || [],
      bonuses: [],
    };

    const canUnlock = checker.canUnlockTalent(talentNode);
    return canUnlock;
  }

  /**
   * Select a bonus path (core path)
   */
  selectBonusPath(pathId: string): void {
    if (!this.talentUIState || !this.characterId) return;

    // Add to selected bonus paths if not already there
    if (!this.talentUIState.selectedBonusPathIds.includes(pathId)) {
      const newSelected = [...this.talentUIState.selectedBonusPathIds, pathId];

      // Persist the bonus path selection first
      this.talentsApi
        .saveTalents(this.characterId, {
          pendingTrees: newSelected,
        })
        .subscribe({
          next: () => {
            // After save succeeds, reload to get updated available trees
            this.loadTalentUIState();

            // Now try to unlock the key talent for this path
            const talentPath = talentTreeManager.getTalentPath(pathId);
            if (talentPath?.talentNodes) {
              const keyTalent = talentPath.talentNodes.find((t: TalentNode) => t.tier === 0);
              if (keyTalent && !this.isTalentUnlocked(keyTalent.id)) {
                this.unlockTalent({ ...keyTalent, pathId: pathId });
              }
            }
          },
          error: (err) => {
            console.error('[TalentView] Failed to save bonus path selection:', err);
          },
        });
    }
  }

  /**
   * Remove a bonus path (core path) selection
   */
  removeBonusPath(pathId: string): void {
    if (!this.talentUIState || !this.characterId) return;

    // Remove from selected
    const newSelected = this.talentUIState.selectedBonusPathIds.filter((p) => p !== pathId);

    // First remove the key talent for this path if it's pending
    const talentPath = talentTreeManager.getTalentPath(pathId);
    const keyTalentId = talentPath?.talentNodes?.find((t: TalentNode) => t.tier === 0)?.id;

    if (keyTalentId && this.talentUIState.pendingTalentIds.includes(keyTalentId)) {
      // Remove the talent first (which will trigger persistence)
      this.removeTalent(keyTalentId);
    }

    // Then persist the bonus path removal
    this.talentsApi
      .saveTalents(this.characterId, {
        pendingTrees: newSelected,
      })
      .subscribe({
        next: () => {
          this.loadTalentUIState();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[TalentView] Failed to save bonus path removal:', err);
        },
      });
  }

  /**
   * Auto-select appropriate initial tree on component load
   * - If singer path required, select singer tree
   * - Otherwise select first available tree
   */
  private autoSelectInitialTree(): void {
    if (!this.talentUIState || this.selectedTree) {
      console.log('[TalentView] autoSelectInitialTree skipping - already has tree or no state');
      return;
    }

    const trees = this.buildAvailableTreesFromKeywords();
    console.log('[TalentView] autoSelectInitialTree - found', trees.length, 'trees');

    if (trees.length === 0) {
      console.log('[TalentView] No trees available to select');
      return;
    }

    // If singer selection required, select singer tree
    if (this.talentUIState.requiresSingerSelection) {
      const singerTree = trees.find((t) => t.pathName.toLowerCase().includes('singer'));
      if (singerTree) {
        console.log('[TalentView] Selecting singer tree');
        this.selectTree(singerTree);
        return;
      }
    }

    // Otherwise select first tree
    console.log('[TalentView] Selecting first tree:', trees[0].pathName);
    this.selectTree(trees[0]);
  }
}
