/**
 * TalentView Component - PHASE 3 REFACTOR (Character-free)
 *
 * Frontend is display + input only. All business logic (availability, costs,
 * effects) is server-side via `getTalentUI` / `saveTalents`.
 */

import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { TalentNode, TalentUIResponse } from '../../../../shared/types/talents';
import talentTreeManager from '../../../../shared/data/talents/talentManager';
import { StepValidationService } from '../../services/step-validation.service';
import { TalentsApiService } from '../../services/talents-api.service';
import { NavFinalizedService } from '../../services/nav-finalized.service';
import { TalentEffectParser } from 'shared/data/talents/talentEffectParser';
import { ExpertiseChoiceDialog, ExpertiseChoiceData } from '../shared/expertise-choice-dialog/expertise-choice-dialog';

@Component({
  selector: 'app-talent-view',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatDialogModule
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
  isLoading: boolean = false;
  validationMessage: string = '';
  isLevelUpMode: boolean = false;
  isFinalized: boolean = false;

  private characterId: string | null = null;
  private pendingExpertiseChoices: Array<{ talentId: string; choices: string[] }> = [];

  // Template compatibility properties (derived from talentUIState)
  get isLoadingTalentData(): boolean { return this.isLoading; }
  get availableTalentPoints(): number { return this.talentUIState?.pointsAvailable || 0; }
  get pointsOverBudget(): number { return this.talentUIState?.pointsOverBudget || 0; }
  get availableTrees(): any[] { return (this.talentUIState?.availableTrees && this.talentUIState.availableTrees.length > 0)
    ? this.talentUIState.availableTrees
    : this.buildAvailableTreesFromKeywords(); }
  get showCorePathSelector(): boolean { return (this.talentUIState?.bonusPathIds?.length || 0) > 0; }
  get availableCorePaths(): any[] { return this.buildBonusPathOptions(); }
  selectedTree: any = null;
  cachedVisibleTalents: any[] = [];

  constructor(
    private activatedRoute: ActivatedRoute,
    private validationService: StepValidationService,
    private dialog: MatDialog,
    private talentsApi: TalentsApiService,
    private navFinalizedService: NavFinalizedService,
    private identityService: CharacterIdentityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('[TalentView] ngOnInit called');

    // Subscribe to nav finalized status for lock state
    this.navFinalizedService.getNavigationFinalized()
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        this.isFinalized = status.talents === 'finalized';
        this.cdr.markForCheck();
      });

    // Subscribe to route params to detect level-up mode
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isLevelUpMode = params['levelUp'] === 'true';
      });

    // Subscribe to current character id and fetch talents UI state
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => id !== null)
      )
      .subscribe((characterId) => {
        if (characterId) {
          this.characterId = characterId;
          console.log('[TalentView] Calling loadTalentUIState for character:', this.characterId);
          this.loadTalentUIState();
        }
      });
    // Note: spren grant acceptance removed from this UI; server is authoritative.
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

    this.talentsApi.getTalentUI(this.characterId)
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
            availableTalentIds: state.availableTalentIds.slice(0, 10)
          });

          // Auto-select appropriate initial tree
          this.autoSelectInitialTree();

          this.updateValidation();
          this.updateVisibleTalentsCache();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[TalentView] API call failed - error:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
  }

  /**
   * Persist step before navigation - calls finalize endpoint
   */
  public persistStep(): Promise<void> {
    if (!this.characterId) {
      console.log('[TalentView] persistStep - no characterId');
    }
    // Talents are saved on unlock, not on step navigation
    return Promise.resolve();
  }

  /**
   * Unlock a talent selected by user
   * Shows expertise dialog if needed, then calls backend
   */
  unlockTalent(talent: any): void {
    console.log('[TalentView] unlockTalent called with:', { talentId: talent.id, talentName: talent.name, pathId: talent.pathId });

    if (!this.characterId) {
      console.log('[TalentView] unlockTalent - no characterId');
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

    console.log('[TalentView] unlockTalent - proceeding with unlock');
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
      // Record single expertises for server persistence
      const existing = this.pendingExpertiseChoices.find(pe => pe.talentId === talent.id);
      if (existing) {
        existing.choices.push(...grant.expertises);
      } else {
        this.pendingExpertiseChoices.push({ talentId: talent.id, choices: [...grant.expertises] });
      }
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
          description: `Choose ${grant.choiceCount || 1} expertise${(grant.choiceCount || 1) > 1 ? 's' : ''} from this talent.`
        } as ExpertiseChoiceData
      });

      dialogRef.afterClosed().subscribe(result => {
        if (result && result.selected) {
          const existing = this.pendingExpertiseChoices.find(pe => pe.talentId === talent.id);
          if (existing) {
            existing.choices.push(...result.selected);
          } else {
            this.pendingExpertiseChoices.push({ talentId: talent.id, choices: [...result.selected] });
          }
          this.handleExpertiseGrants(talent, grants, grantIndex + 1);
        }
      });
    }
  }

  private applyTalentUnlock(talent: TalentNode): void {
    console.log('[TalentView] applyTalentUnlock called for:', talent.id);

    if (!this.characterId) {
      console.log('[TalentView] applyTalentUnlock - no characterId');
      return;
    }

    // Persist only pending talents and any expertise choices collected
    const newPending = new Set(this.talentUIState?.pendingTalentIds || []);
    newPending.add(talent.id);

    const expertiseForThis = this.pendingExpertiseChoices.filter(pe => pe.talentId === talent.id);

    const payload: any = {
      pendingTalents: Array.from(newPending)
    };

    if (expertiseForThis.length > 0) {
      payload.expertiseChoices = expertiseForThis.map(pe => ({ talentId: pe.talentId, choices: pe.choices }));
    }

    console.log('[TalentView] applyTalentUnlock - sending to server:', {
      talentId: talent.id,
      payload
    });

    this.talentsApi.saveTalents(this.characterId, payload).subscribe({
      next: () => {
        console.log('[TalentView] applyTalentUnlock - server response received, reloading UI state');
        // Clear recorded expertise choices for this talent
        this.pendingExpertiseChoices = this.pendingExpertiseChoices.filter(pe => pe.talentId !== talent.id);
        // Reload UI state from backend with updated values
        this.loadTalentUIState();
        this.updateValidation();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[TalentView] Failed to save talent unlock:', err);
        this.talentUIState = null;
        this.loadTalentUIState();
      }
    });
  }

  /**
   * Remove talent selected by user
   */
  removeTalent(talentId: string): void {
    if (!this.characterId) return;

    // Can only remove talents that are pending (selected this session)
    const isPending = this.talentUIState?.pendingTalentIds?.includes(talentId);
    if (!isPending) return;

    // Persist to backend - only modify PENDING talents
    const newPending = new Set(this.talentUIState?.pendingTalentIds || []);
    newPending.delete(talentId);

    this.talentsApi.saveTalents(this.characterId, {
      pendingTalents: Array.from(newPending)
    }).subscribe({
      next: () => {
        this.loadTalentUIState();
        this.updateValidation();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[TalentView] Failed to save talent removal:', err);
        this.talentUIState = null;
        this.loadTalentUIState();
      }
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
    
    // Return all nodes from selected tree with their server-provided state
    // The template will use isAvailable/isUnlocked/isPending for display
    return this.selectedTree.nodes.map((talent: any) => ({
      ...talent,
      id: talent.id,
      pathId: this.selectedTree.mainPathId || this.selectedTree.pathName
    }));
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
          'first': 'First Ideal',
          'second': 'Second Ideal',
          'third': 'Third Ideal',
          'fourth': 'Fourth Ideal',
          'fifth': 'Fifth Ideal'
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
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Update validation message based on current state
   */
  private updateValidation(): void {
    if (!this.talentUIState) {
      this.validationService.setStepValid(this.STEP_INDEX, false);
      return;
    }

    // In level-up mode: points must be fully spent
    if (this.isLevelUpMode) {
      const pointsSpent = this.talentUIState.pointsAvailable === 0;
      this.validationMessage = pointsSpent ? '' : `Select ${this.talentUIState.pointsAvailable} more talent(s)`;
      this.validationService.setStepValid(this.STEP_INDEX, pointsSpent);
      this.checkPendingStatus();
      return;
    }

    // Check for over-budget condition (level was decreased after talents were selected)
    if (this.talentUIState.pointsOverBudget > 0) {
      this.validationMessage = `Over budget by ${this.talentUIState.pointsOverBudget} — please remove ${this.talentUIState.pointsOverBudget} talent(s)`;
      this.validationService.setStepValid(this.STEP_INDEX, false);
      this.checkPendingStatus();
      return;
    }

    // Character creation mode: specific rules
    let isValid = true;
    if (this.talentUIState.requiresSingerSelection) {
      const hasPendingSingerTalent = this.talentUIState.pendingTalentIds.some(id => 
        this.talentUIState!.talentKeywords[id]?.pathId?.includes('singer')
      );
      isValid = hasPendingSingerTalent;
      this.validationMessage = isValid ? '' : 'You must select at least one Singer talent at this level';
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
    // Spren acceptance removed — server handles radiant application.
  }

  /**
   * Build TalentTree objects from talentKeywords for template compatibility
   * Fetches actual prerequisites from talent data
   */
  private buildAvailableTreesFromKeywords(): any[] {
    if (!this.talentUIState) return [];

    // Delegate grouping to shared manager — it attaches raw prerequisites but
    // does NOT compute unlocked/available state (backend responsibility)
    const displayTrees = talentTreeManager.buildDisplayTreesFromKeywords(this.talentUIState.talentKeywords || {});

    // Map manager output to the UI-compatible shape expected by the template
    return displayTrees.map(dt => ({
      pathName: dt.pathName,
      mainPathId: dt.key,
      nodes: dt.nodes.map((n: any) => ({
        id: n.id,
        name: (n.__keywords && n.__keywords.name) || n.name,
        description: (n.__keywords && n.__keywords.description) || n.description || '',
        tier: (n.__keywords && n.__keywords.tier) ?? n.tier,
        expertiseKeywords: (n.__keywords && n.__keywords.expertiseKeywords) || n.expertiseKeywords || [],
        prerequisites: n.prerequisites || []
      }))
    })).sort((a, b) => a.pathName.localeCompare(b.pathName));
  }

  /**
   * Build bonus path options for template
   */
  private buildBonusPathOptions(): any[] {
    if (!this.talentUIState) return [];

    return this.talentUIState.bonusPathIds.map(pathId => {
      const talentPath = talentTreeManager.getTalentPath(pathId);
      const keyTalent = talentPath?.talentNodes?.find((t: TalentNode) => t.tier === 0);
      
      return {
        id: pathId,
        name: this.formatPathName(pathId),
        keyTalent: keyTalent || { 
          id: 'unknown',
          name: this.formatPathName(pathId),
          description: 'Key talent not found'
        },
        isSelected: this.talentUIState?.selectedBonusPathIds.includes(pathId) || false
      };
    });
  }

  private formatPathName(pathId: string): string {
    return pathId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
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
   * Check if a talent can be unlocked
   * Trusts server-provided node state from availableTrees
   */
  canUnlockTalent(talent: any): boolean {
    if (!talent || !this.talentUIState) return false;

    // Need points available
    if (this.availableTalentPoints <= 0) return false;

    // Find node in server-provided trees (authoritative source)
    if (this.talentUIState.availableTrees) {
      for (const tree of this.talentUIState.availableTrees) {
        const node = tree.nodes.find((n: any) => n.id === talent.id);
        if (node) {
          // Server provides isAvailable, isUnlocked, isPending flags
          return !!node.isAvailable && !node.isUnlocked && !node.isPending;
        }
      }
    }

    // Fallback: check if in availableTalentIds and not already selected
    const isAvailable = this.talentUIState.availableTalentIds.includes(talent.id);
    const isUnlocked = this.talentUIState.unlockedTalentIds.includes(talent.id);
    const isPending = this.talentUIState.pendingTalentIds.includes(talent.id);
    return isAvailable && !isUnlocked && !isPending;
  }

  /**
   * Select a bonus path (core path)
   * Backend handles adding the tier 0 talent automatically via pendingTrees sync
   */
  selectBonusPath(pathId: string): void {
    if (!this.talentUIState || !this.characterId) return;

    // Add to selected bonus paths if not already there
    if (!this.talentUIState.selectedBonusPathIds.includes(pathId)) {
      const newSelected = [...this.talentUIState.selectedBonusPathIds, pathId];
      
      // Single server call - backend handles tier 0 talent auto-add
      this.talentsApi.saveTalents(this.characterId, {
        pendingTrees: newSelected
      }).subscribe({
        next: () => {
          // Reload to get updated state (tier 0 added by backend)
          this.loadTalentUIState();
        },
        error: (err) => {
          console.error('[TalentView] Failed to save bonus path selection:', err);
        }
      });
    }
  }

  /**
   * Remove a bonus path (core path) selection
   * Backend handles removing the tier 0 talent automatically via pendingTrees sync
   */
  removeBonusPath(pathId: string): void {
    if (!this.talentUIState || !this.characterId) return;

    // Remove from selected
    const newSelected = this.talentUIState.selectedBonusPathIds.filter(p => p !== pathId);
    
    // Single server call - backend handles tier 0 talent removal
    this.talentsApi.saveTalents(this.characterId, {
      pendingTrees: newSelected
    }).subscribe({
      next: () => {
        this.loadTalentUIState();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('[TalentView] Failed to save bonus path removal:', err);
      }
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

    const trees = this.availableTrees;
    console.log('[TalentView] autoSelectInitialTree - found', trees.length, 'trees');
    
    if (trees.length === 0) {
      console.log('[TalentView] No trees available to select');
      return;
    }

    // If singer selection required, select singer tree
    if (this.talentUIState.requiresSingerSelection) {
      const singerTree = trees.find(t => t.pathName.toLowerCase().includes('singer'));
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