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
 * - Gets current character state directly via getCharacter() snapshot
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
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { TalentTree, TalentNode, TalentPath } from '../../character/talents/talentInterface';
import { TalentPrerequisiteChecker } from '../../character/talents/talentPrerequesite';
import { getTalentTree, getTalentPath } from '../../character/talents/talentTrees/talentTrees';
import { StepValidationService } from '../../services/step-validation.service';
import { WebsocketService, SprenGrantEvent } from '../../services/websocket.service';
import { LevelUpApiService, LevelTables } from '../../services/levelup-api.service';
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
  private requiresSingerSelection = false;
  private baseTalentPoints = 0;

  constructor(
    private activatedRoute: ActivatedRoute,
    private characterState: CharacterStateService,
    private validationService: StepValidationService,
    private websocketService: WebsocketService,
    private dialog: MatDialog,
    private levelUpManager: LevelUpManager,
    private levelUpApi: LevelUpApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.levelUpApi.getTables()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tables) => {
          this.levelTables = tables;
          this.levelUpManager.notifyPointsChanged();
        },
        error: () => {
          // Fallback silently to LevelUpManager tables
        }
      });

    // Listen to points changed events from LevelUpManager
    this.levelUpManager.pointsChanged$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.checkPendingStatus();
      });

    // Subscribe only to route params changes - do NOT subscribe to character$
    // during level-up mode. This prevents stale cache reuse when navigating
    // between level-up steps.
    this.activatedRoute.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      const newIsLevelUpMode = params['levelUp'] === 'true';
      const enteringLevelUpMode = newIsLevelUpMode && !this.isLevelUpMode;
      
      this.isLevelUpMode = newIsLevelUpMode;
      
      // Reset sliceLoaded when entering level-up mode - this forces fresh fetch
      // when re-entering level-up mode
      if (enteringLevelUpMode) {
        this.sliceLoaded = false;
      }
      
      // Get current character from service (not from subscription)
      const character = this.characterState.getCharacter();
      this.character = character;
      this.characterId = (character as any)?.id || null;

      if (!this.character) return;

      // Track when paths are populated from server
      const pathsNowLoaded = character.paths && character.paths.length > 0 && character.paths[0];
      if (pathsNowLoaded && !this.pathsLoaded) {
        console.log('[TalentView] Paths loaded from server:', character.paths);
        this.pathsLoaded = true;
        // Trigger lazy loading of trees now that paths are available
        this.lazyLoadTrees();
      }

      // On first initialization, sync unlockedTalents from character
      if (!this.isInitialized) {
        this.unlockedTalents = new Set(character.unlockedTalents);
        this.isInitialized = true;
        
        // Render the page first with loading state, then fetch talent data
        this.loadCorePathOptions();
        // Don't load trees here - wait for lazy load trigger when paths are ready
        this.calculateAvailablePoints();
        this.updateValidation();
        
        // Add a timeout safeguard to force tree loading if paths don't update in time
        setTimeout(() => {
          if (!this.pathsLoaded && this.character?.paths?.[0]) {
            console.log('[TalentView] Timeout: forcing tree load for paths:', this.character.paths);
            this.pathsLoaded = true;
            this.lazyLoadTrees();
          }
        }, 1000); // 1 second timeout

        // Lazy load talent data from API if we have a character ID
        // Both level-up and creation modes need to fetch from API to get proper talent calculations
        if (this.characterId) {
          this.fetchTalentForLevel(this.characterId);
        }
      } else {
        // Sync current talents
        this.unlockedTalents = new Set(character.unlockedTalents);

        // Always render immediately
        this.loadCorePathOptions();
        // Reload trees if paths are loaded
        if (this.pathsLoaded) {
          this.loadAvailableTrees();
        }
        this.calculateAvailablePoints();
        this.updateValidation();

        // Only fetch when entering level-up mode (transition from false to true) or when not yet loaded
        if (this.characterId && (enteringLevelUpMode || !this.sliceLoaded)) {
          this.fetchTalentForLevel(this.characterId);
        }
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

  private loadCorePathOptions(): void {
    if (!this.character) return;

    // Show core path selector for humans and singers at level 1 or during level-up
    this.showCorePathSelector = (this.character.ancestry != null && 
                    ['human', 'singer'].includes(this.character.ancestry)) && 
                    (this.character.level === 1 || this.isInLevelUpMode());
    
    if (!this.showCorePathSelector) {
      this.availableCorePaths = [];
      return;
    }

    const mainPathName = this.character.paths[0];
    const allPaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
    
    this.availableCorePaths = allPaths
      .filter(pathId => pathId !== mainPathName) // Exclude main path
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
          isSelected: this.unlockedTalents.has(keyTalent.id)
        };
      })
      .filter(p => p !== null) as PathOption[];
  }

  selectCorePath(pathOption: PathOption): void {
    if (pathOption.isSelected) {
      // Deselect - remove the talent
      this.removeTalent(pathOption.keyTalent.id);
    } else {
      // Select - unlock the key talent
      this.unlockTalent(pathOption.keyTalent);
    }
    // Reload core path options to update selected state
    this.loadCorePathOptions();
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
          this.loadCorePathOptions();
          this.loadAvailableTrees();
          this.calculateAvailablePoints();
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

  private lazyLoadTrees(): void {
    console.log('[TalentView] Lazy loading trees now that paths are ready');
    this.loadCorePathOptions();
    this.loadAvailableTrees();
    this.calculateAvailablePoints();
    this.updateValidation();
    this.cdr.markForCheck();
  }

  private persistTalents(): void {
    if (!this.character || !this.characterId) {
      return;
    }

    const payload = {
      unlockedTalents: Array.from(this.unlockedTalents)
    };

    this.levelUpApi.updateTalentSlice(this.characterId, payload.unlockedTalents)
      .pipe(takeUntil(this.destroy$))
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
    // If the server provided points, we are definitively in level-up logic
    return this.baseTalentPoints !== 0 || this.isLevelUpMode || pending > 0;
  }

  private loadAvailableTrees(): void {
    if (!this.character) return;

    // Guard: defer if paths not yet loaded from server
    if (!this.pathsLoaded && !this.character.paths?.[0]) {
      console.log('[TalentView] Deferring loadAvailableTrees - paths not yet loaded');
      return;
    }

    const tempTrees: TalentTree[] = [];
    const addedTreeNames = new Set<string>(); // Track to prevent duplicates
    
    // Expected format: paths[0] = main path (e.g., "warrior"), paths[1] = specialization (e.g., "Soldier")
    const mainPathName = this.character.paths[0];
    const specializationName = this.character.paths[1];
    
    console.log('[TalentView] loadAvailableTrees - mainPath:', mainPathName, 'spec:', specializationName, 'ancestry:', this.character.ancestry, 'level:', this.character.level);
    
    // For humans and singers at level 1 or during level-up, load their chosen path, all sub trees, and bonus path logic
    if ((this.character.ancestry != null && ['human','singer'].includes(this.character.ancestry)) &&
      (this.character.level === 1 || this.isInLevelUpMode())) {
      console.log('[TalentView] Taking human/singer branch');
      // Helper to check if a path's key talent is unlocked
      const hasPathKeyTalent = (pathId: string): boolean => {
        const talentPath = getTalentPath(pathId);
        if (!talentPath || !talentPath.talentNodes) return false;
        return talentPath.talentNodes.some(node => 
          node.tier === 0 && this.unlockedTalents.has(node.id)
        );
      };
      // Load the character's chosen main path (key talent auto-unlocked)
      if (mainPathName) {
        const talentPath = getTalentPath(mainPathName);
        if (talentPath) {
          // Always auto-unlock tier 0 for main path core tree
          if (talentPath.talentNodes && talentPath.talentNodes.length > 0) {
            const coreTree = {
              pathName: `${talentPath.name} - Core`,
              nodes: talentPath.talentNodes
            };
            this.autoUnlockTier0Talents(coreTree);
            tempTrees.push(coreTree);
            addedTreeNames.add(coreTree.pathName.toLowerCase());
          }
          // Add specializations from this path (these are unlocked by the key talent)
          talentPath.paths.forEach(specTree => {
            if (!addedTreeNames.has(specTree.pathName.toLowerCase())) {
              this.autoUnlockTier0Talents(specTree);
              tempTrees.push(specTree);
              addedTreeNames.add(specTree.pathName.toLowerCase());
            }
          });
        }
      }
      // Check all paths for unlocked key talents and add their specialties
      const allPaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
      allPaths.forEach(pathId => {
        const talentPath = getTalentPath(pathId);
        if (!talentPath) return;
        // If this path's key talent is unlocked, add its specialties
        if (hasPathKeyTalent(pathId)) {
          talentPath.paths.forEach(specTree => {
            if (!addedTreeNames.has(specTree.pathName.toLowerCase())) {
              this.autoUnlockTier0Talents(specTree);
              tempTrees.push(specTree);
              addedTreeNames.add(specTree.pathName.toLowerCase());
            }
          });
        } else if (pathId !== mainPathName) {
          // If key talent not unlocked and not main path, show core tree so they can pick the key talent
          if (talentPath.talentNodes && talentPath.talentNodes.length > 0) {
            const coreTree = {
              pathName: `${talentPath.name} - Core`,
              nodes: talentPath.talentNodes
            };
            // Don't auto-unlock tier 0 talents from other paths - they must choose them
            if (!addedTreeNames.has(coreTree.pathName.toLowerCase())) {
              tempTrees.push(coreTree);
              addedTreeNames.add(coreTree.pathName.toLowerCase());
            }
          }
        }
      });
    } else {
      // For non-humans or higher levels, load only the character's chosen path
      console.log('[TalentView] Taking non-human/higher-level branch');
      if (mainPathName) {
        console.log('[TalentView] Getting talent path for:', mainPathName);
        const talentPath = getTalentPath(mainPathName);
        console.log('[TalentView] getTalentPath result:', talentPath);
        if (talentPath) {
          // Add the core/shared talent nodes as a tree
          if (talentPath.talentNodes && talentPath.talentNodes.length > 0) {
            const coreTree = {
              pathName: `${talentPath.name} - Core`,
              nodes: talentPath.talentNodes
            };
            this.autoUnlockTier0Talents(coreTree);
            tempTrees.push(coreTree);
            addedTreeNames.add(coreTree.pathName.toLowerCase());
          }
          
          // If specialization specified, only load that tree
          if (specializationName) {
            const specializationTree = talentPath.paths.find(
              tree => tree.pathName.toLowerCase() === specializationName.toLowerCase()
            );
            if (specializationTree && !addedTreeNames.has(specializationTree.pathName.toLowerCase())) {
              this.autoUnlockTier0Talents(specializationTree);
              tempTrees.push(specializationTree);
              addedTreeNames.add(specializationTree.pathName.toLowerCase());
            }
          }
        }
      }
      
      // Also load specialization as direct tree if not found above
      if (specializationName && !addedTreeNames.has(specializationName.toLowerCase())) {
        const tree = getTalentTree(specializationName);
        if (tree) {
          this.autoUnlockTier0Talents(tree);
          tempTrees.push(tree);
          addedTreeNames.add(tree.pathName.toLowerCase());
        }
      }
    }

    // Also include ancestry/culture specific trees if they exist
    if (this.character.ancestry) {
      const ancestryTree = getTalentTree(this.character.ancestry);
      if (ancestryTree && !addedTreeNames.has(ancestryTree.pathName.toLowerCase())) {
        this.autoUnlockTier0Talents(ancestryTree);
        tempTrees.push(ancestryTree);
        addedTreeNames.add(ancestryTree.pathName.toLowerCase());
      }
    }

    // Include Radiant Order tree if spren is bound
    if (this.character.radiantPath.hasSpren()) {
      const orderTreeId = this.character.radiantPath.getOrderTree();
      if (orderTreeId) {
        const orderPath = getTalentPath(orderTreeId);
        if (orderPath) {
          // Radiant orders have their talents in paths[0], not talentNodes
          if (orderPath.paths && orderPath.paths.length > 0) {
            const radiantTree = orderPath.paths[0];
            this.autoUnlockTier0Talents(radiantTree);
            if (!addedTreeNames.has(radiantTree.pathName.toLowerCase())) {
              tempTrees.push(radiantTree);
              addedTreeNames.add(radiantTree.pathName.toLowerCase());
            }
          }
        }
      }
    }

    // Include Surge trees if First Ideal is spoken
    if (this.character.radiantPath.hasSpokenIdeal()) {
      const surgeTrees = this.character.radiantPath.getSurgeTrees();
      surgeTrees.forEach(surgeTreeId => {
        const surgeTree = getTalentTree(surgeTreeId);
        if (surgeTree && !addedTreeNames.has(surgeTree.pathName.toLowerCase())) {
          this.autoUnlockTier0Talents(surgeTree);
          tempTrees.push(surgeTree);
          addedTreeNames.add(surgeTree.pathName.toLowerCase());
        }
      });
    }

    // If no trees loaded, try to load based on cultures
    if (tempTrees.length === 0 && this.character.cultures.length > 0) {
      console.log('[TalentView] No trees loaded, trying cultures fallback');
      this.character.cultures.forEach(culture => {
        const cultureTree = getTalentTree(culture.name);
        if (cultureTree && !addedTreeNames.has(cultureTree.pathName.toLowerCase())) {
          this.autoUnlockTier0Talents(cultureTree);
          tempTrees.push(cultureTree);
          addedTreeNames.add(cultureTree.pathName.toLowerCase());
        }
      });
    }

    console.log('[TalentView] tempTrees before filtering:', tempTrees.length, tempTrees.map(t => t.pathName));

    // For singers, do not filter out core trees, and ensure all sub trees and core tree are present
    // For both humans and singers, filter out core trees from the chip selector, but keep them for display if needed
    this.availableTrees = tempTrees.filter(tree => {
      const isCoreTree = tree.pathName.toLowerCase().includes('core');
      // Only show core trees if they're the only option (shouldn't happen, but fallback)
      if (isCoreTree && tempTrees.length > 1) {
        return false;
      }
      // Only keep trees that have tier 1+ talents
      const visibleTalents = tree.nodes.filter(talent => talent.tier > 0);
      return visibleTalents.length > 0;
    });
    
    console.log('[TalentView] availableTrees after filtering:', this.availableTrees.length, this.availableTrees.map(t => t.pathName));
    
    // Strip " - Core" from any remaining tree names for display (shouldn't be needed now)
    this.availableTrees = this.availableTrees.map(tree => ({
      ...tree,
      pathName: tree.pathName.replace(/ - Core$/i, '')
    }));
    // Sort trees to prioritize the character's chosen path or Singer tree for singers
    if (this.character.ancestry != null && ['human', 'singer'].includes(this.character.ancestry) && specializationName) {
      this.availableTrees.sort((a, b) => {
        // For singers, show Singer tree first if present
        if (this.character?.ancestry === 'singer') {
          const aIsSinger = a.pathName.toLowerCase().includes('singer');
          const bIsSinger = b.pathName.toLowerCase().includes('singer');
          if (aIsSinger && !bIsSinger) return -1;
          if (!aIsSinger && bIsSinger) return 1;
        }
        // For both, show chosen specialization first
        const aIsChosen = a.pathName.toLowerCase() === specializationName.toLowerCase();
        const bIsChosen = b.pathName.toLowerCase() === specializationName.toLowerCase();
        if (aIsChosen && !bIsChosen) return -1;
        if (!aIsChosen && bIsChosen) return 1;
        return 0;
      });
    }
    // Default selected tree: Singer tree for singers, otherwise first available
    if (this.availableTrees.length > 0 && !this.selectedTree) {
      if (this.character && this.character.ancestry === 'singer') {
        const singerTree = this.availableTrees.find(tree => tree.pathName.toLowerCase().includes('singer'));
        this.selectedTree = singerTree || this.availableTrees[0];
      } else {
        this.selectedTree = this.availableTrees[0];
      }
    }
      // ...existing code...
  }

  private autoUnlockTier0Talents(tree: TalentTree): void {
    if (!this.character) return;

    tree.nodes.forEach(talent => {
      if (talent.tier === 0 && !this.unlockedTalents.has(talent.id)) {
        this.unlockedTalents.add(talent.id);
        // Apply the talent effects
        this.character!.bonuses.unlockTalent(talent.id, talent);
        
        // Persist to character state
        this.characterState.unlockTalent(talent.id);
      }
    });
  }

  private calculateAvailablePoints(): void {
    if (!this.character) {
      this.availableTalentPoints = 0;
      return;
    }

    // Base points provided by server for this level
    const totalPoints = this.baseTalentPoints ?? 0;
    
    // Only main path tier 0 talent is free
    const tier0Talents = new Set<string>();
    const mainPath = this.character.paths?.[0];
    if (mainPath) {
      const mainPathDef = getTalentPath(mainPath);
      const coreTier0 = mainPathDef?.talentNodes?.find(node => node.tier === 0);
      if (coreTier0) {
        tier0Talents.add(coreTier0.id);
      }
    }

    let newTalents = 0;
    this.unlockedTalents.forEach(talentId => {
      if (!this.lockedTalents.has(talentId) && !tier0Talents.has(talentId)) {
        newTalents++;
      }
    });

    this.availableTalentPoints = Math.max(0, totalPoints - newTalents);
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
      // At level 1, humans and singers can select tier 0 talents from other paths as their bonus talent
      // During level-up or multi-level creation, they can also select tier 0 talents if they have points
      // isInLevelUpMode covers both explicit level-up AND multi-level creation scenarios
      if ((this.character.ancestry === 'human' || this.character.ancestry === 'singer') && 
          (this.character.level === 1 || this.isInLevelUpMode())) {
        // Allow if they still have points available
        return true;
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
      // Notify character state of changes (skip broadcasting during level-up)
      if (!this.isLevelUpMode) {
        this.characterState.updateCharacter(this.character!);
      }
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
          // Notify character state of changes (skip broadcasting during level-up)
          if (!this.isLevelUpMode) {
            this.characterState.updateCharacter(this.character!);
          }
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

    // Update local state
    this.unlockedTalents.add(talent.id);
    this.calculateAvailablePoints();
    
    // Apply talent effects using BonusManager
    this.character.bonuses.unlockTalent(talent.id, talent);
    
    // Apply special talent effects (e.g., grant Singer forms)
    applyTalentEffects(this.character, talent.id);

    // Persist to character state service
    this.characterState.unlockTalent(talent.id);
    
    // Don't auto-persist on every change - only persist when Next is clicked
    
    // If a tier 0 talent (key talent) was selected from another path, reload trees to show its specialties
    if (talent.tier === 0 && (this.character.ancestry === 'human' || this.character.ancestry === 'singer') && 
        (this.character.level === 1 || this.isInLevelUpMode())) {
      this.loadAvailableTrees();
    }
    
    this.updateValidation();
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
      
      console.log('[Talent View] Removed talent:', {
        talentId,
        isLevelUpMode: this.isLevelUpMode,
        remainingUnlocked: this.unlockedTalents.size
      });
      
      // Reload core path options to update selected state
      this.loadCorePathOptions();
      
      this.calculateAvailablePoints();
      
      // Remove talent bonuses using the source format that matches unlockTalent
      this.character.bonuses.bonuses.removeBonus(`talent:${talentId}`);
      
      // Remove expertises granted by this talent
      this.character.bonuses.removeExpertisesByTalent(talentId);
      
      // Persist to character state service
      this.characterState.removeTalent(talentId);
      
      // Don't auto-persist on every change - only persist when Next is clicked
      
      this.updateValidation();
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
    if (this.character?.ancestry === 'human' && this.character.level === 1 && talent.tier === 1) {
      const mainPathName = this.character.paths[0];
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
    const mainPathName = this.character.paths[0];
    let autoUnlockedKeyTalentId: string | null = null;
    
    if (mainPathName && this.character.level === 1) {
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
    requiredTalents = this.character.level || 1;
    
    if (this.character.ancestry === 'singer' || this.character.ancestry === 'human') {
      requiredTalents += 1; // Both get +1 bonus talent at level 1
    }
    
    const isValid = unlockedPaidTalents >= requiredTalents;
    
    // Set validation message
    if (this.character.ancestry === 'singer' && singerTalents === 0) {
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
    
    // Unlock the tier 0 radiant talent
    const orderPath = getTalentPath(this.pendingSprenGrant.order.toLowerCase());
    if (orderPath?.talentNodes) {
      const keyTalent = orderPath.talentNodes.find(t => t.tier === 0);
      if (keyTalent) {
        this.unlockTalent(keyTalent);
      }
    }

    // Clear the pending grant
    this.pendingSprenGrant = null;

    // Reload trees to show radiant order
    this.loadAvailableTrees();
    this.updateValidation();
  }
}