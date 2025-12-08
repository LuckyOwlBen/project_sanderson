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
  
  character: Character | null = null;
  availableTrees: TalentTree[] = [];
  selectedTree: TalentTree | null = null;
  unlockedTalents = new Set<string>();
  availableTalentPoints: number = 0;

  constructor(private characterState: CharacterStateService) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
        // Sync local state with persisted state
        this.unlockedTalents = new Set(character.unlockedTalents);
        this.loadAvailableTrees();
        this.calculateAvailablePoints();
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
    
    // Load the main path if it exists
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
    // Base calculation - adjust based on your game rules
    this.availableTalentPoints = this.character?.level ?? 1;
    // Subtract already unlocked talents
    this.availableTalentPoints -= this.unlockedTalents.size;
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
}