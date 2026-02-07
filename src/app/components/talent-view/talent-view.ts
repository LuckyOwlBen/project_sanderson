/**
 * TalentView Component - PHASE 2.3 REFACTOR
 * 
 * MIGRATION: Removed subscription to character$ Observable
 * 
 * PROBLEM FIXED:
 * - Previously had separate subscriptions to queryParams AND character$
 * - When navigating back from other steps, character$ would re-emit
 * - Component would reuse stale sliceLoaded flag from first visit
 * - This prevented fresh talent data from being fetched
 * 
 * SOLUTION:
 * - Now subscribes ONLY to queryParams changes
 * - Loads character data from storage service when ID is available
 * - Resets sliceLoaded flag on each param change to force fresh API fetch
 * - Only fetches during level-up mode to avoid unnecessary calls
 * - Prevents stale cache from being reused when revisiting step
 * 
 * ARCHITECTURE:
 * - Level-up components are now independent of character$ emissions
 * - Backend slice APIs remain the source of truth for talent point allocation
 * - Each visit to a level-up step triggers fresh data fetch
 */

import { Component, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, filter, forkJoin, take } from 'rxjs';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { CharacterStorageService } from '../../services/character-storage.service';
import { TalentUIService } from '../../services/talent-ui.service';
import { Character } from '../../character/character';
import { TalentTree, TalentNode, TalentPath } from '../../../../shared/types/talents';
import { TalentPrerequisiteChecker } from '../../character/talents/talentPrerequesite';
import { getTalentTree, getTalentPath } from '../../../../shared/data/talents/talentTrees';
import { StepValidationService } from '../../services/step-validation.service';
import { WebsocketService, SprenGrantEvent } from '../../services/websocket.service';
import { LevelUpApiService, LevelTables } from '../../services/levelup-api.service';
import { TalentsApiService, TalentsState } from '../../services/talents-api.service';
import { PathsApiService, PathsSelection } from '../../services/paths-api.service';
import { SkillType } from '../../character/skills/skillTypes';
import { TalentEffectParser } from '../../character/talents/talentEffectParser';
import { applyTalentEffects } from '../../character/talents/talentEffects';
import { ExpertiseChoiceDialog, ExpertiseChoiceData } from '../shared/expertise-choice-dialog/expertise-choice-dialog';
import { LevelUpManager } from '../../levelup/levelUpManager';

interface PathOption {
  id: string;
  name: string;
  keyTalent: TalentNode;
  isSelected: boolean;
}

@Component({
  selector: 'app-talent-view',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatDialogModule,
    MatIconModule
  ],
  templateUrl: './talent-view.html',
  styleUrl: './talent-view.scss',
})
export class TalentView implements OnInit, OnDestroy {
  @Output() pendingChange = new EventEmitter<boolean>();
  
  private destroy$ = new Subject<void>();
  private readonly STEP_INDEX = 7;
  
  character: Character | null = null;
  availableTrees: TalentTree[] = [];
  selectedTree: TalentTree | null = null;
  unlockedTalents = new Set<string>();
  availableTalentPoints: number = 0;
  validationMessage: string = '';
  availableCorePaths: PathOption[] = [];
  showCorePathSelector: boolean = false;
  pendingSprenGrant: SprenGrantEvent | null = null;
  isLevelUpMode: boolean = false;
  isLoadingTalentData: boolean = false; // Add loading state
  private characterId: string | null = null;
  private levelTables?: LevelTables;
  private isInitialized: boolean = false;
  private sliceLoaded: boolean = false;
  private pathsLoaded: boolean = false;
  private lockedTalents = new Set<string>();
  private characterPaths: PathsSelection | null = null;
  private characterAncestry: string | null = null;
  private characterLevel: number = 1;
  private requiresSingerSelection = false;
  private baseTalentPoints = 0;
  private characterRadiantPath: { boundOrder: string | null; currentIdeal: number; idealSpoken: boolean; surgePair: string | null; sprenType: string | null } | null = null;
  private pendingBonusTrees = new Set<string>();  // Bonus paths selected (removable until finalized)

  constructor(
    private activatedRoute: ActivatedRoute,
    private validationService: StepValidationService,
    private websocketService: WebsocketService,
    private dialog: MatDialog,
    private levelUpManager: LevelUpManager,
    private levelUpApi: LevelUpApiService,
    private talentsApi: TalentsApiService,
    private pathsApi: PathsApiService,
    private identityService: CharacterIdentityService,
    private characterStorage: CharacterStorageService,
    private talentUIService: TalentUIService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('[TalentView] ngOnInit called');
    
    // Listen to points changed events from LevelUpManager
    this.levelUpManager.pointsChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkPendingStatus();
      });

    // Subscribe to route params to detect level-up mode
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isLevelUpMode = params['levelUp'] === 'true';
      });

    // Once we have a character ID from identity service, fetch talents
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => id !== null)
      )
      .subscribe((characterId) => {
        console.log('[TalentView] Received characterId from identityService:', characterId);
        if (characterId) {
          this.characterId = characterId;
          console.log('[TalentView] Set characterId to:', this.characterId);

          this.characterStorage.loadCharacter(characterId)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (character) => {
                console.log('[TalentView] Loaded character from storage:', character?.id);
                this.character = character;

                if (!this.character) {
                  console.log('[TalentView] No character found, returning');
                  return;
                }

                // Paths are now loaded via the API in fetchTalentsState, so we don't need this check anymore
                // Just proceed with the rest of initialization

                // On first initialization, sync unlockedTalents from character
                if (!this.isInitialized) {
                  this.unlockedTalents = new Set(this.character.unlockedTalents);
                  this.isInitialized = true;
                  
                  // Render the page first with loading state, then fetch talent data
                  this.loadBonusPathOptions();
                  // Don't load trees here - wait for lazy load trigger when paths are ready
                  this.updateValidation();
                  
                  // Paths are now loaded via API, so no timeout needed

                  // Fetch talent state from API
                  if (this.characterId) {
                    console.log('[TalentView] Init: Calling fetchTalentsState with characterId:', this.characterId);
                    this.fetchTalentsState(this.characterId);
                  }
                } else {
                  // Sync current talents
                  this.unlockedTalents = new Set(this.character.unlockedTalents);

                  // Always render immediately
                  this.loadBonusPathOptions();
                  // Reload trees if paths are loaded
                  if (this.pathsLoaded) {
                    this.loadAvailableTrees();
                  }
                  this.updateValidation();
                  
                  // Fetch updated talent state from API
                  if (this.characterId) {
                    console.log('[TalentView] Re-init: Calling fetchTalentsState with characterId:', this.characterId);
                    this.fetchTalentsState(this.characterId);
                  }
                }

                this.cdr.markForCheck();
              },
              error: (error) => {
                console.error('[TalentView] Failed to load character from storage:', error);
              }
            });
        }
      });

    // Listen for spren grants
    this.websocketService.sprenGrant$
      .pipe(takeUntil(this.destroy$))
      .subscribe(grant => {
        console.log('[TalentView] Spren grant received:', grant);
        console.log('[TalentView] Current character ID:', (this.character as any)?.id);
        if (this.character && grant.characterId === (this.character as any).id) {
          console.log('[TalentView] Match! Showing spren notification');
          this.pendingSprenGrant = grant;
          // Auto-dismiss after 30 seconds
          setTimeout(() => {
            if (this.pendingSprenGrant === grant) {
              this.pendingSprenGrant = null;
            }
          }, 30000);
        } else {
          console.log('[TalentView] No match - character ID mismatch');
        }
      });
  }

  private loadBonusPathOptions(): void {
    if (!this.character || !this.characterPaths?.type) return;

    // Get available bonus paths from service
    const available = this.talentUIService.getAvailableBonusClasses(
      this.characterPaths.type,
      this.characterPaths.sub
    );

    // Map to display objects
    this.availableCorePaths = available
      .map(pathId => {
        const talentPath = getTalentPath(pathId);
        if (!talentPath || !talentPath.talentNodes || talentPath.talentNodes.length === 0) {
          return null;
        }

        const keyTalent = talentPath.talentNodes.find(t => t.tier === 0);
        if (!keyTalent) return null;

        return {
          id: pathId,
          name: talentPath.name,
          keyTalent: keyTalent,
          isSelected: this.pendingBonusTrees.has(pathId)
        };
      })
      .filter(p => p !== null) as PathOption[];

    this.showCorePathSelector = this.availableCorePaths.length > 0;
    console.log('[TalentView] loadBonusPathOptions: availableCorePaths =', this.availableCorePaths);
  }

  selectBonusPath(pathId: string): void {
    if (!this.characterId) return;
    
    this.pendingBonusTrees.add(pathId);
    
    // Unlock the tier 0 talent (key talent) for this path
    // This will also auto-unlock all tier 1 talents and deduct points via applyTalentUnlock()
    const talentPath = getTalentPath(pathId);
    if (talentPath?.talentNodes) {
      const keyTalent = talentPath.talentNodes.find(t => t.tier === 0);
      if (keyTalent && !this.unlockedTalents.has(keyTalent.id)) {
        this.unlockTalent(keyTalent);
      }
    }
    
    // Persist the bonus path selection to backend
    const totalTalents = Array.from(this.lockedTalents);
    const pendingTalents = Array.from(this.unlockedTalents).filter(
      (talentId) => !this.lockedTalents.has(talentId)
    );
    const pendingTrees = Array.from(this.pendingBonusTrees);

    const payload = {
      totalPoints: this.baseTalentPoints ?? 0,
      totalTalents,
      pendingTalents,
      pendingTrees,
      finalized: false
    };

    this.talentsApi.saveTalents(this.characterId, payload)
      .pipe(take(1))
      .subscribe({
        next: () => {
          // After persisting, fetch the updated talent state from backend
          // The backend will recalculate availableTrees including bonus path specializations
          this.fetchTalentsState(this.characterId!);
        },
        error: (err) => {
          console.error('[TalentView] Failed to save bonus path selection:', err);
        }
      });
  }

  removeBonusPath(pathId: string): void {
    if (!this.characterId) return;
    
    this.pendingBonusTrees.delete(pathId);
    
    // Remove the tier 0 talent (key talent) for this path
    // This will refund points via removeTalent()
    const talentPath = getTalentPath(pathId);
    if (talentPath?.talentNodes) {
      const keyTalent = talentPath.talentNodes.find(t => t.tier === 0);
      if (keyTalent && this.unlockedTalents.has(keyTalent.id)) {
        this.removeTalent(keyTalent.id);
      }
      
      // Also remove all tier 1 talents that were auto-unlocked by this bonus path
      // Only remove if they're not in lockedTalents (weren't pre-selected)
      const tier1Talents = talentPath.talentNodes.filter(t => t.tier === 1);
      tier1Talents.forEach(t1 => {
        if (this.unlockedTalents.has(t1.id) && !this.lockedTalents.has(t1.id)) {
          this.removeTalent(t1.id);
        }
      });
    }
    
    // Persist the bonus path removal to backend
    const totalTalents = Array.from(this.lockedTalents);
    const pendingTalents = Array.from(this.unlockedTalents).filter(
      (talentId) => !this.lockedTalents.has(talentId)
    );
    const pendingTrees = Array.from(this.pendingBonusTrees);

    const payload = {
      totalPoints: this.baseTalentPoints ?? 0,
      totalTalents,
      pendingTalents,
      pendingTrees,
      finalized: false
    };

    this.talentsApi.saveTalents(this.characterId, payload)
      .pipe(take(1))
      .subscribe({
        next: () => {
          // After persisting, fetch the updated talent state from backend
          // The backend will recalculate availableTrees without the removed bonus path
          this.fetchTalentsState(this.characterId!);
        },
        error: (err) => {
          console.error('[TalentView] Failed to save bonus path removal:', err);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private fetchTalentForLevel(characterId: string): void {
    console.log('[TalentView] Starting lazy load of talent data from API...');
    this.isLoadingTalentData = true;
    
    // During character creation: request cumulative points from level 1 to current level
    // During level-up: request points for current level only
    const isCreationMode = !this.isLevelUpMode;
    this.levelUpApi.getTalentForLevel(characterId, isCreationMode)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          console.log('[TalentView] Talent data received from API:', resp);
          this.isLoadingTalentData = false;
          
          if ((resp as any).requiresPathSelection) {
            this.availableTalentPoints = 0;
            this.baseTalentPoints = 0;
            this.lockedTalents = new Set();
            this.requiresSingerSelection = false;
            this.validationMessage = 'Select a main path and specialization first.';
            this.validationService.setStepValid(this.STEP_INDEX, false);
            this.checkPendingStatus();
            return;
          }

          this.availableTalentPoints = resp.talentPoints;
          this.baseTalentPoints = resp.talentPoints;
          const locked = resp.previouslySelectedTalents || (resp as any).lockedPowers || [];
          this.lockedTalents = new Set(locked);
          this.requiresSingerSelection = resp.requiresSingerSelection;

          if (this.character) {
            this.character.level = resp.level ?? this.character.level;
            // Don't overwrite ancestry - it should already be set from character state
          }

          // Mark as loaded and update UI with the fetched data
          this.sliceLoaded = true;
          this.loadBonusPathOptions();
          this.loadAvailableTrees();
          this.updateValidation();
          
          // Defer change detection to next cycle to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => {
            this.cdr.markForCheck();
          }, 0);
          
          console.log('[TalentView] Talent data loaded and view updated');
        },
        error: (err) => {
          console.error('[TalentView] Failed to load talent data for level:', err);
          this.isLoadingTalentData = false;
          
          // Defer change detection to next cycle
          setTimeout(() => {
            this.cdr.markForCheck();
          }, 0);
        }
      });
  }

  private fetchTalentsState(characterId: string): void {
    console.log('[TalentView] Loading talent state from API for character:', characterId);
    this.isLoadingTalentData = true;
    this.cdr.markForCheck();

    forkJoin([
      this.talentsApi.getTalents(characterId),
      this.pathsApi.getPaths(characterId)
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ([state, paths]) => {
          console.log('[TalentView] Talent state loaded:', state);
          console.log('[TalentView] Paths loaded:', paths);
          
          // Store character state
          this.characterPaths = this.normalizePaths(paths);
          this.characterAncestry = state.ancestry ?? null;
          this.characterLevel = state.level ?? 1;
          this.characterRadiantPath = state.radiantPath ?? null;
          
          // Store talent point data
          const totalTalents = state.totalTalents ?? [];
          const pendingTalents = state.pendingTalents ?? [];
          
          this.baseTalentPoints = state.totalPoints ?? 0;
          this.availableTalentPoints = state.pointsRemaining ?? 0;
          this.lockedTalents = new Set(totalTalents);
          this.unlockedTalents = new Set([...totalTalents, ...pendingTalents]);
          this.requiresSingerSelection = state.requiresSingerSelection ?? false;
          
          // BACKEND CORRECTION: The backend counts all talents equally in pointsRemaining.
          // However, tier 0 talents (key talents) cost 0 points, not 1.
          // We need to refund the points for any locked tier 0 talents.
          let tier0LockedCount = 0;
          totalTalents.forEach(talentId => {
            if (this.isKeyTalentId(talentId)) {
              tier0LockedCount++;
            }
          });
          this.availableTalentPoints += tier0LockedCount;
          
          if (tier0LockedCount > 0) {
            console.log('[TalentView] Corrected for tier 0 locked talents:', {
              tier0LockedCount,
              beforeCorrection: state.pointsRemaining,
              afterCorrection: this.availableTalentPoints
            });
          }
          
          // Track bonus trees selection from API
          this.pendingBonusTrees = new Set(state.pendingTrees ?? []);
          
          // Sync API talent state back to character object
          if (this.character) {
            this.character.unlockedTalents = new Set(this.unlockedTalents);
          }

          // Use TalentUIService to load trees and add radiant trees
          let trees = this.talentUIService.loadTreesForIds(state.availableTrees ?? []);
          trees = this.talentUIService.addRadiantTrees(trees, state.radiantPath);
          
          this.availableTrees = trees;
          this.selectedTree = this.talentUIService.getDefaultSelectedTree(trees, this.characterAncestry);
          
          this.isLoadingTalentData = false;
          this.sliceLoaded = true;
          this.loadBonusPathOptions();
          this.updateValidation();

          // Trigger change detection immediately
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('[TalentView] Failed to load talent state:', err);
          this.isLoadingTalentData = false;
          this.cdr.markForCheck();
        }
      });
  }

  private normalizePaths(paths: PathsSelection | null): PathsSelection | null {
    if (!paths) return null;

    const corePaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
    let type = paths.type;
    let sub = paths.sub;

    if (type && sub) {
      const typeIsCore = corePaths.includes(type.toLowerCase());
      const subIsCore = corePaths.includes(sub.toLowerCase());
      if (!typeIsCore && subIsCore) {
        console.warn('[TalentView] Swapping path fields (type/sub appear reversed):', { type, sub });
        const temp = type;
        type = sub;
        sub = temp;
      }
    }

    return { type, sub };
  }

  private persistTalents(): void {
    if (!this.character || !this.characterId) {
      return;
    }

    const totalTalents = Array.from(this.lockedTalents);
    const pendingTalents = Array.from(this.unlockedTalents).filter(
      (talentId) => !this.lockedTalents.has(talentId)
    );
    const pendingTrees = Array.from(this.pendingBonusTrees);

    const payload = {
      totalPoints: this.baseTalentPoints ?? 0,
      totalTalents,
      pendingTalents,
      pendingTrees,
      finalized: false
    };

    this.talentsApi.saveTalents(this.characterId, payload)
      .pipe(take(1))
      .subscribe({
        next: () => {},
        error: () => {}
      });
  }

  // Persist hook called by CharacterCreatorView before navigating to next step
  public persistStep(): void {
    if (this.characterId) {
      this.persistTalents();
    }
  }

  private getTalentPointsForLevel(level: number): number {
    if (this.levelTables?.talentPointsPerLevel?.length) {
      return this.levelTables.talentPointsPerLevel[level - 1] || 0;
    }
    return this.levelUpManager.getTalentPointsForLevel(level);
  }

  // Effective level-up mode: either explicit query param or pending level points present
  private isInLevelUpMode(): boolean {
    const pending = this.character?.pendingLevelPoints ?? 0;
    // Only treat as level-up when explicitly in level-up flow or pending points exist
    return this.isLevelUpMode || pending > 0;
  }

  private loadAvailableTrees(): void {
    // Trees are now loaded and determined by the backend via fetchTalentsState()
    // This method is kept for legacy call sites but does nothing since the backend
    // returns the correct availableTrees based on character state (including bonus paths from pendingTrees)
    console.log('[TalentView] loadAvailableTrees called - backend handles tree determination');
  }

  private isKeyTalentId(talentId: string): boolean {
    const allPaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
    return allPaths.some(pathId => {
      const talentPath = getTalentPath(pathId);
      if (!talentPath?.talentNodes) return false;
      return talentPath.talentNodes.some(node => node.tier === 0 && node.id === talentId);
    });
  }

  private autoUnlockTier0Talents(tree: TalentTree): void {
    if (!this.character) return;

    tree.nodes.forEach(talent => {
      if (talent.tier === 0 && !this.unlockedTalents.has(talent.id)) {
        this.unlockedTalents.add(talent.id);
        this.character!.unlockedTalents.add(talent.id);
        // Apply the talent effects
        this.character!.bonuses.unlockTalent(talent.id, talent);
      }
    });
  }

  private calculateAvailablePoints(): void {
    if (!this.character) {
      this.availableTalentPoints = 0;
      return;
    }

    // Use the API's pointsRemaining directly (already includes bonuses)
    // This is set during fetchTalentsState from the server response
    // Don't recalculate - trust the server value
    // The availableTalentPoints represents unspent points after level bonuses applied
  }

  selectTree(tree: TalentTree): void {
    this.selectedTree = tree;
  }

  canUnlockTalent(talent: TalentNode): boolean {
    if (!this.character || this.unlockedTalents.has(talent.id)) {
      return false;
    }

    if (this.availableTalentPoints <= 0) {
      return false;
    }

    // Special handling for tier 0 talents (key talents)
    if (talent.tier === 0) {
      // For humans and singers: allow tier 0 talent selection during character creation at any level
      // Also allow during actual level-up mode at level 1 or when pending points exist
      if (this.characterAncestry === 'human' || this.characterAncestry === 'singer') {
        // During character creation (any level), allow selecting bonus paths
        if (!this.isLevelUpMode) {
          return true;
        }
        // During explicit level-up mode, allow at level 1 or when pending points exist
        if (this.characterLevel === 1 || this.isInLevelUpMode()) {
          return true;
        }
      }
      // Otherwise, tier 0 talents shouldn't be manually unlockable (they're auto-unlocked)
      return false;
    }

    // Enforce singer-first selection when server requires it
    if (this.requiresSingerSelection) {
      const isSingerTalent = this.selectedTree?.pathName.toLowerCase().includes('singer');
      
      if (!isSingerTalent) {
        // Check if they have already selected a singer talent
        const hasSingerTalent = this.availableTrees.some(tree => {
          const isSingerTree = tree.pathName.toLowerCase().includes('singer');
          return isSingerTree && tree.nodes.some(node => 
            this.unlockedTalents.has(node.id) && node.tier > 0
          );
        });
        
        if (!hasSingerTalent) {
          return false; // Must pick singer talent first
        }
      }
    }

    const checker = new TalentPrerequisiteChecker(this.character, this.unlockedTalents);
    return checker.canUnlockTalent(talent);
  }

  unlockTalent(talent: TalentNode): void {
    if (this.canUnlockTalent(talent) && this.character) {
      // Parse expertise grants from talent (prioritizes structured expertiseGrants)
      const expertiseGrants = TalentEffectParser.parseExpertiseGrantsFromTalent(talent);
      
      if (expertiseGrants.length > 0) {
        // Handle expertise grants
        this.handleExpertiseGrants(talent, expertiseGrants, 0);
      } else {
        // No expertise grants, proceed normally
        this.applyTalentUnlock(talent);
      }
    }
  }

  private handleExpertiseGrants(talent: TalentNode, grants: any[], grantIndex: number): void {
    if (grantIndex >= grants.length) {
      // All grants processed, apply talent unlock
      this.applyTalentUnlock(talent);
      return;
    }

    const grant = grants[grantIndex];

    if (grant.type === 'single') {
      // Auto-grant single expertises
      grant.expertises.forEach((expertiseName: string) => {
        this.character!.bonuses.grantExpertise(talent.id, expertiseName);
      });
      // Process next grant
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
          // Grant selected expertises
          result.selected.forEach((expertiseName: string) => {
            this.character!.bonuses.grantExpertise(talent.id, expertiseName);
          });
          // Process next grant
          this.handleExpertiseGrants(talent, grants, grantIndex + 1);
        } else {
          // User cancelled - don't unlock the talent
          console.log('Expertise choice cancelled');
        }
      });
    }
  }

  private applyTalentUnlock(talent: TalentNode): void {
    if (!this.character) return;

    // Check if this is a NEW talent (not in lockedTalents)
    const isNewTalent = !this.lockedTalents.has(talent.id);

    // Update local state
    this.unlockedTalents.add(talent.id);
    this.character.unlockedTalents.add(talent.id);
    
    // If this is a new talent, deduct its cost from available points
    // Tier 0 talents (key talents) cost 0 points - only tier 1+ talents cost 1 point
    if (isNewTalent && talent.tier > 0) {
      this.availableTalentPoints = Math.max(0, this.availableTalentPoints - 1);
      console.log('[TalentView] Unlocked talent:', talent.id, '- Points remaining:', this.availableTalentPoints);
    }
    
    // Apply talent effects using BonusManager
    this.character.bonuses.unlockTalent(talent.id, talent);
    
    // Apply special talent effects (e.g., grant Singer forms)
    applyTalentEffects(this.character, talent.id);

    // If a tier 0 talent (bonus path) was selected, auto-unlock all tier 1 talents in that path
    if (talent.tier === 0) {
      // Find which path this tier 0 talent belongs to
      const allPaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
      for (const pathId of allPaths) {
        const talentPath = getTalentPath(pathId);
        if (!talentPath || !talentPath.talentNodes) continue;
        
        const keyTalent = talentPath.talentNodes.find(t => t.tier === 0);
        if (keyTalent && keyTalent.id === talent.id) {
          // Found the path - auto-unlock all tier 1 talents
          // Note: Do NOT deduct points here for tier 1 talents - the backend will count them in the array
          // and calculate the correct pointsRemaining when we persist/fetch
          const tier1Talents = talentPath.talentNodes.filter(t => t.tier === 1);
          tier1Talents.forEach(t1 => {
            if (!this.unlockedTalents.has(t1.id)) {
              this.unlockedTalents.add(t1.id);
              this.character!.unlockedTalents.add(t1.id);
              this.character!.bonuses.unlockTalent(t1.id, t1);
              applyTalentEffects(this.character!, t1.id);
              
              // Point deduction for tier 1 talents is handled by backend calculation
              // when we persist and fetch the updated availableTalentPoints
            }
          });
          break;
        }
      }
    }

    // Don't auto-persist on every change - only persist when Next is clicked
    
    // If a tier 0 talent (key talent) was selected from another path, reload trees to show its specialties
    if (talent.tier === 0 && (this.characterAncestry === 'human' || this.characterAncestry === 'singer')) {
      // Reload trees during character creation or during level-up mode
      if (!this.isLevelUpMode || this.characterLevel === 1 || this.isInLevelUpMode()) {
        this.loadAvailableTrees();
      }
    }
    
    this.updateValidation();
    this.cdr.markForCheck();
  }

  removeTalent(talentId: string): void {
    // Locked talents (previously selected powers) cannot be removed
    if (this.lockedTalents.has(talentId)) {
      return;
    }

    // Check if any other talents depend on this one
    const hasDependents = this.selectedTree?.nodes.some(t => 
      this.unlockedTalents.has(t.id) && 
      t.prerequisites.some(p => 
        (typeof p === 'string' && p === talentId) || 
        (typeof p === 'object' && p.type === 'talent' && p.target === talentId)
      )
    );

    if (!hasDependents && this.character) {
      // Update local state
      this.unlockedTalents.delete(talentId);
      this.character.unlockedTalents.delete(talentId);
      
      console.log('[Talent View] Removed talent:', {
        talentId,
        isLevelUpMode: this.isLevelUpMode,
        remainingUnlocked: this.unlockedTalents.size
      });
      
      // Reload bonus path options to update selected state
      this.loadBonusPathOptions();
      
      // Remove talent bonuses using the source format that matches unlockTalent
      this.character.bonuses.bonuses.removeBonus(`talent:${talentId}`);
      
      // Remove expertises granted by this talent
      this.character.bonuses.removeExpertisesByTalent(talentId);

      // If a key talent was removed, reload trees to drop any bonus path specializations
      if (this.isKeyTalentId(talentId)) {
        this.loadAvailableTrees();
      }
      
      // Persist removal immediately and fetch fresh state from backend
      // This ensures availableTalentPoints and validation message are always in sync
      if (this.characterId) {
        const totalTalents = Array.from(this.lockedTalents);
        const pendingTalents = Array.from(this.unlockedTalents).filter(
          (talentId) => !this.lockedTalents.has(talentId)
        );
        const pendingTrees = Array.from(this.pendingBonusTrees);

        const payload = {
          totalPoints: this.baseTalentPoints ?? 0,
          totalTalents,
          pendingTalents,
          pendingTrees,
          finalized: false
        };

        this.talentsApi.saveTalents(this.characterId, payload)
          .pipe(take(1))
          .subscribe({
            next: () => {
              // After persisting, fetch the updated talent state from backend
              this.fetchTalentsState(this.characterId!);
            },
            error: (err) => {
              console.error('[TalentView] Failed to save talent removal:', err);
            }
          });
      } else {
        this.updateValidation();
      }
    }
  }

  isTalentUnlocked(talentId: string): boolean {
    return this.unlockedTalents.has(talentId);
  }

  canRemoveTalent(talentId: string): boolean {
    // Locked talents (previously selected powers) cannot be removed
    return !this.lockedTalents.has(talentId);
  }

  shouldDisplayTalent(talent: TalentNode): boolean {
    // Tier 0 talents are now handled by the core path selector, not shown in trees
    if (talent.tier === 0) {
      return false;
    }

    // For tier 1+ talents, check if they're from the main path or from a path with unlocked key talent
    if (this.characterAncestry === 'human' && this.characterLevel === 1 && talent.tier === 1) {
      const mainPathName = this.characterPaths?.type;
      const selectedTreePath = this.selectedTree?.pathName.toLowerCase() || '';
      
      // Check if this tree belongs to the main path
      const isMainPathTree = mainPathName && selectedTreePath.includes(mainPathName.toLowerCase());
      
      if (isMainPathTree) {
        // Allow tier 1 talents from main path
      } else {
        // For other paths, only show tier 1+ if that path's key talent is unlocked
        // Determine which path this tree belongs to
        const allPaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
        let belongsToPath: string | null = null;
        
        for (const pathId of allPaths) {
          const talentPath = getTalentPath(pathId);
          if (talentPath) {
            const pathNameLower = talentPath.name.toLowerCase();
            if (selectedTreePath.includes(pathNameLower)) {
              belongsToPath = pathId;
              break;
            }
          }
        }
        
        // Check if this path's key talent is unlocked
        if (belongsToPath) {
          const talentPath = getTalentPath(belongsToPath);
          if (talentPath?.talentNodes) {
            const keyTalent = talentPath.talentNodes.find(t => t.tier === 0);
            if (!keyTalent || !this.unlockedTalents.has(keyTalent.id)) {
              // Key talent not unlocked, don't show tier 1+ talents
              return false;
            }
          }
        }
      }
    }

    // Always show unlocked talents
    if (this.isTalentUnlocked(talent.id)) {
      return true;
    }

    // Always show tier 1 talents (even if locked)
    if (talent.tier === 1) {
      return true;
    }

    // For tier 2+ talents, show if prerequisites are met
    if (!this.character) {
      return false;
    }

    const checker = new TalentPrerequisiteChecker(this.character, this.unlockedTalents);
    return checker.canUnlockTalent(talent);
  }

  getVisibleTalents(): TalentNode[] {
    if (!this.selectedTree) {
      return [];
    }
    return this.selectedTree.nodes.filter(talent => this.shouldDisplayTalent(talent));
  }

  formatPrerequisite(prereq: string | any): string {
    if (typeof prereq === 'string') {
      // Simple talent ID reference - try to find the talent name
      const talent = this.selectedTree?.nodes.find(t => t.id === prereq);
      return talent ? talent.name : prereq;
    }

    // Complex prerequisite object
    switch (prereq.type) {
      case 'talent':
        const talent = this.selectedTree?.nodes.find(t => t.id === prereq.target);
        return talent ? talent.name : prereq.target;
      
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

  private updateValidation(): void {
    if (!this.character) {
      this.validationService.setStepValid(this.STEP_INDEX, false);
      return;
    }

    // Get the main path to determine which tier 0 talent is auto-unlocked
    const mainPathName = this.characterPaths?.type;
    let autoUnlockedKeyTalentId: string | null = null;
    
    if (mainPathName && this.characterLevel === 1) {
      const mainPath = getTalentPath(mainPathName);
      if (mainPath?.talentNodes) {
        const keyTalent = mainPath.talentNodes.find(t => t.tier === 0);
        if (keyTalent) {
          autoUnlockedKeyTalentId = keyTalent.id;
        }
      }
    }

    // Count unlocked talents that cost points
    let unlockedPaidTalents = 0;
    let singerTalents = 0;
    
    // Count tier 0 talents from bonus paths (selected via core path selector)
    this.availableCorePaths.forEach(pathOption => {
      if (pathOption.isSelected) {
        unlockedPaidTalents++;
      }
    });
    
    // Count tier 1+ talents from specialty trees
    this.availableTrees.forEach(tree => {
      const isSingerTree = tree.pathName.toLowerCase().includes('singer');
      
      tree.nodes.forEach(talent => {
        if (this.unlockedTalents.has(talent.id) && talent.tier > 0) {
          unlockedPaidTalents++;
          if (isSingerTree) {
            singerTalents++;
          }
        }
      });
    });
    
    // Calculate required talents based on level and ancestry
    let requiredTalents: number;
    
    if (this.isInLevelUpMode()) {
      // If the level-up slice isn't loaded yet, don't show mismatched messages
      if (!this.sliceLoaded) {
        this.validationMessage = '';
        this.validationService.setStepValid(this.STEP_INDEX, false);
        this.checkPendingStatus();
        return;
      }
      // In level-up mode, we just need available points to be fully spent
      const isValid = this.availableTalentPoints === 0;
      
      // Set validation message
      if (!isValid) {
        this.validationMessage = `Select ${this.availableTalentPoints} more talent${this.availableTalentPoints > 1 ? 's' : ''} to continue`;
      } else {
        this.validationMessage = '';
      }
      
      this.validationService.setStepValid(this.STEP_INDEX, isValid);
      this.checkPendingStatus();
      return;
    }
    
    // Character creation mode - use total required
    requiredTalents = this.characterLevel || 1;
    
    if (this.characterAncestry === 'singer' || this.characterAncestry === 'human') {
      requiredTalents += 1; // Both get +1 bonus talent at level 1
    }
    
    const isValid = unlockedPaidTalents >= requiredTalents;
    
    // Set validation message
    if (this.characterAncestry === 'singer' && singerTalents === 0) {
      this.validationMessage = 'Please select a Singer path talent first (from the Singer tree) before choosing other talents.';
    } else if (!isValid) {
      const remaining = requiredTalents - unlockedPaidTalents;
      this.validationMessage = `Select ${remaining} more talent${remaining > 1 ? 's' : ''} to continue`;
    } else {
      this.validationMessage = '';
    }
    
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
    this.checkPendingStatus();
  }

  private checkPendingStatus(): void {
    // Has pending changes if there are talent points available to allocate
    const hasPending = this.availableTalentPoints > 0;
    this.pendingChange.emit(hasPending);
  }

  acceptSpren(): void {
    if (!this.character || !this.pendingSprenGrant) return;

    // Grant the spren to the character
    this.character.radiantPath.grantSpren(this.pendingSprenGrant.order);

    // Clear the pending grant
    this.pendingSprenGrant = null;

    // Reload trees to show radiant order
    this.loadAvailableTrees();
    this.updateValidation();
  }
}