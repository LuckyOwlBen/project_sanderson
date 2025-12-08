import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { CharacterStorageService } from '../../services/character-storage.service';
import { ALL_TALENT_PATHS, getTalentTree } from '../../character/talents/talentTrees/talentTrees';
import { TalentTree } from '../../character/talents/talentInterface';

@Component({
  selector: 'app-character-review',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './character-review.html',
  styleUrl: './character-review.scss',
})
export class CharacterReview implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  character: Character | null = null;

  constructor(
    private characterState: CharacterStateService,
    private characterStorage: CharacterStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getTrainedSkills(): Array<{name: string, rank: number}> {
    const trainedSkills: Array<{name: string, rank: number}> = [];
    if (this.character?.skills) {
      try {
        const skillRanks = this.character.skills.getAllSkillRanks();
        
        Object.entries(skillRanks).forEach(([skillType, rank]: [string, any]) => {
          if (rank > 0) {
            trainedSkills.push({
              name: this.formatSkillName(skillType),
              rank: rank
            });
          }
        });
      } catch (error) {
        console.error('Error accessing skill ranks:', error);
      }
    }
    return trainedSkills.sort((a, b) => a.name.localeCompare(b.name));
  }

  private formatSkillName(skillType: string): string {
    return skillType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getTalentIds(): string[] {
    return Array.from(this.character?.unlockedTalents || []);
  }

  getTalentCount(tierFilter?: number): number {
    if (!this.character) return 0;
    
    let count = 0;
    this.character.unlockedTalents.forEach(() => {
      // For now, count all talents
      // Could filter by tier if needed
      count++;
    });
    return count;
  }

  finalizeCharacter(): void {
    if (!this.character) return;
    
    this.characterStorage.saveCharacter(this.character)
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { success: boolean; id: string }) => {
        if (result.success) {
          console.log('Character saved:', result.id);
          this.router.navigate(['/character-sheet', result.id]);
        } else {
          alert('Failed to save character. Please try again.');
        }
      });
  }

  getTalentName(talentId: string): string {
    // Search through all available talent trees
    const allTrees: TalentTree[] = [];
    
    // Get trees from paths
    Object.values(ALL_TALENT_PATHS).forEach(path => {
      if (path.talentNodes) {
        allTrees.push({ pathName: path.name, nodes: path.talentNodes });
      }
      allTrees.push(...path.paths);
    });
    
    // Also search ancestry trees
    const ancestryTree = getTalentTree('singer');
    if (ancestryTree) {
      allTrees.push(ancestryTree);
    }
    
    // Search for the talent
    for (const tree of allTrees) {
      const talent = tree.nodes.find(n => n.id === talentId);
      if (talent) {
        return talent.name;
      }
    }
    
    // Fallback to formatted ID
    return talentId.split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  }
}




