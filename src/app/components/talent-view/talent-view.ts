import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { TalentTree, TalentNode } from '../../character/talents/talentInterface';
import { TalentPrerequisiteChecker } from '../../character/talents/talentPrerequesite';
import { getTalentTree } from '../../character/talents/talentTrees/talentTrees';

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

    this.availableTrees = [];
    
    // Get trees based on character's paths
    this.character.paths.forEach(pathName => {
      const tree = getTalentTree(pathName);
      if (tree) {
        this.availableTrees.push(tree);
      }
    });

    // Also include ancestry/culture specific trees if they exist
    if (this.character.ancestry) {
      const ancestryTree = getTalentTree(this.character.ancestry);
      if (ancestryTree) {
        this.availableTrees.push(ancestryTree);
      }
    }

    // If no trees loaded, try to load based on cultures
    if (this.availableTrees.length === 0 && this.character.cultures.length > 0) {
      this.character.cultures.forEach(culture => {
        const cultureTree = getTalentTree(culture.name);
        if (cultureTree) {
          this.availableTrees.push(cultureTree);
        }
      });
    }

    // Select first tree by default
    if (this.availableTrees.length > 0 && !this.selectedTree) {
      this.selectedTree = this.availableTrees[0];
    }
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