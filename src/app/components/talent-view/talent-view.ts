import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { TalentTree, TalentNode, TalentPath } from '../../character/talents/talentInterface';
import { TalentPrerequisiteChecker } from '../../character/talents/talentPrerequesite';
import { getTalentTree, getTalentPath } from '../../character/talents/talentTrees/talentTrees';
import { StepValidationService } from '../../services/step-validation.service';

@Component({
  selector: 'app-talent-view',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './talent-view.html',
  styleUrl: './talent-view.scss',
})
export class TalentView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly STEP_INDEX = 6;
  
  character: Character | null = null;
  availableTrees: TalentTree[] = [];
  selectedTree: TalentTree | null = null;
  unlockedTalents = new Set<string>();
  availableTalentPoints: number = 0;
  validationMessage: string = '';

  constructor(
    private characterState: CharacterStateService,
    private validationService: StepValidationService
  ) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
        // Sync local state with persisted state
        this.unlockedTalents = new Set(character.unlockedTalents);
        this.loadAvailableTrees();
        this.calculateAvailablePoints();
        this.updateValidation();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvailableTrees(): void {
    if (!this.character) return;

    const tempTrees: TalentTree[] = [];
    const addedTreeNames = new Set<string>(); // Track to prevent duplicates
    
    // Expected format: paths[0] = main path (e.g., "warrior"), paths[1] = specialization (e.g., "Soldier")
    const mainPathName = this.character.paths[0];
    const specializationName = this.character.paths[1];
    
    // For humans at level 1, load ALL heroic paths (they can pick bonus talent from any path)
    if (this.character.ancestry === 'human' && this.character.level === 1) {
      const allPaths = ['warrior', 'scholar', 'hunter', 'leader', 'envoy', 'agent'];
      
      allPaths.forEach(pathId => {
        const talentPath = getTalentPath(pathId);
        if (talentPath) {
          // Add core tree
          if (talentPath.talentNodes && talentPath.talentNodes.length > 0) {
            const coreTree = {
              pathName: `${talentPath.name} - Core`,
              nodes: talentPath.talentNodes
            };
            this.autoUnlockTier0Talents(coreTree);
            tempTrees.push(coreTree);
            addedTreeNames.add(coreTree.pathName.toLowerCase());
          }
          
          // Add all specializations from this path
          talentPath.paths.forEach(specTree => {
            if (!addedTreeNames.has(specTree.pathName.toLowerCase())) {
              this.autoUnlockTier0Talents(specTree);
              tempTrees.push(specTree);
              addedTreeNames.add(specTree.pathName.toLowerCase());
            }
          });
        }
      });
    } else {
      // For non-humans or higher levels, load only the character's chosen path
      if (mainPathName) {
        const talentPath = getTalentPath(mainPathName);
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

    // If no trees loaded, try to load based on cultures
    if (tempTrees.length === 0 && this.character.cultures.length > 0) {
      this.character.cultures.forEach(culture => {
        const cultureTree = getTalentTree(culture.name);
        if (cultureTree && !addedTreeNames.has(cultureTree.pathName.toLowerCase())) {
          this.autoUnlockTier0Talents(cultureTree);
          tempTrees.push(cultureTree);
          addedTreeNames.add(cultureTree.pathName.toLowerCase());
        }
      });
    }

    // Filter out trees that have no visible talents (only tier 0)
    this.availableTrees = tempTrees.filter(tree => {
      const visibleTalents = tree.nodes.filter(talent => talent.tier > 0);
      return visibleTalents.length > 0;
    });

    // Sort trees to prioritize the character's chosen path
    if (this.character.ancestry === 'singer') {
      // Singers: show Singer tree first
      this.availableTrees.sort((a, b) => {
        const aIsSinger = a.pathName.toLowerCase().includes('singer');
        const bIsSinger = b.pathName.toLowerCase().includes('singer');
        if (aIsSinger && !bIsSinger) return -1;
        if (!aIsSinger && bIsSinger) return 1;
        return 0;
      });
    } else if (this.character.ancestry === 'human' && specializationName) {
      // Humans: show their chosen specialization first
      this.availableTrees.sort((a, b) => {
        const aIsChosen = a.pathName.toLowerCase() === specializationName.toLowerCase();
        const bIsChosen = b.pathName.toLowerCase() === specializationName.toLowerCase();
        if (aIsChosen && !bIsChosen) return -1;
        if (!aIsChosen && bIsChosen) return 1;
        
        // Then show core tree of chosen path
        const aIsCore = mainPathName && a.pathName.toLowerCase().includes(mainPathName.toLowerCase()) && a.pathName.toLowerCase().includes('core');
        const bIsCore = mainPathName && b.pathName.toLowerCase().includes(mainPathName.toLowerCase()) && b.pathName.toLowerCase().includes('core');
        if (aIsCore && !bIsCore) return -1;
        if (!aIsCore && bIsCore) return 1;
        
        return 0;
      });
    }

    // Select first tree by default
    if (this.availableTrees.length > 0 && !this.selectedTree) {
      this.selectedTree = this.availableTrees[0];
    }
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

    // Base talent points equal to character level
    let totalPoints = this.character.level ?? 1;
    
    // Humans get +1 bonus talent point at level 1
    if (this.character.ancestry === 'human' && this.character.level === 1) {
      totalPoints += 1;
    }
    
    // Singers get +1 bonus talent point at level 1 (for starting form)
    if (this.character.ancestry === 'singer' && this.character.level === 1) {
      totalPoints += 1;
    }
    
    // Only subtract talents that cost points (tier 1+, not tier 0 which are free)
    let spentPoints = 0;
    this.availableTrees.forEach(tree => {
      tree.nodes.forEach(talent => {
        if (this.unlockedTalents.has(talent.id) && talent.tier > 0) {
          spentPoints++;
        }
      });
    });
    
    this.availableTalentPoints = totalPoints - spentPoints;
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

    // Singers must select at least 1 singer talent (starting form) before other talents
    if (this.character.ancestry === 'singer' && this.character.level === 1) {
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
      // Update local state
      this.unlockedTalents.add(talent.id);
      this.calculateAvailablePoints();
      
      // Apply talent effects using BonusManager
      this.character.bonuses.unlockTalent(talent.id, talent);
      
      // Persist to character state service
      this.characterState.unlockTalent(talent.id);
      
      this.updateValidation();
    }
  }

  removeTalent(talentId: string): void {
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
      this.calculateAvailablePoints();
      
      // Remove talent bonuses using the source format that matches unlockTalent
      this.character.bonuses.bonuses.removeBonus(`talent:${talentId}`);
      
      // Persist to character state service
      this.characterState.removeTalent(talentId);
      
      this.updateValidation();
    }
  }

  isTalentUnlocked(talentId: string): boolean {
    return this.unlockedTalents.has(talentId);
  }

  shouldDisplayTalent(talent: TalentNode): boolean {
    // Never show tier 0 talents (they're auto-unlocked and free)
    if (talent.tier === 0) {
      return false;
    }

    // Always show unlocked talents
    if (this.isTalentUnlocked(talent.id)) {
      return true;
    }

    // Show if prerequisites are met (even if can't unlock due to lack of points)
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

  getTalentStyle(talent: TalentNode): any {
    // Position based on tier for now - can be enhanced later
    return {
      'grid-column': 'auto',
      'grid-row': talent.tier + 1
    };
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
        return `${prereq.target} (Rank ${prereq.value || 1}+)`;
      
      case 'attribute':
        return `${prereq.target} ${prereq.value || 1}+`;
      
      case 'level':
        return `Level ${prereq.value || 1}+`;
      
      default:
        return String(prereq);
    }
  }

  private updateValidation(): void {
    if (!this.character) {
      this.validationService.setStepValid(this.STEP_INDEX, false);
      return;
    }

    // Count unlocked talents that cost points (tier 1+)
    let unlockedPaidTalents = 0;
    let singerTalents = 0;
    
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
    let requiredTalents = this.character.level || 1;
    
    if (this.character.ancestry === 'singer' || this.character.ancestry === 'human') {
      requiredTalents += 1; // Both get +1 bonus talent at level 1
    }
    
    const isValid = unlockedPaidTalents >= requiredTalents;
    
    // Set validation message
    if (this.character.ancestry === 'singer' && singerTalents === 0) {
      this.validationMessage = 'Singers must select at least one starting form from the Singer tree';
    } else if (!isValid) {
      const remaining = requiredTalents - unlockedPaidTalents;
      this.validationMessage = `Select ${remaining} more talent${remaining > 1 ? 's' : ''} to continue`;
    } else {
      this.validationMessage = '';
    }
    
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
  }
}