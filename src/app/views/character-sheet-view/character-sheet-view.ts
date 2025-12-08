import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, takeUntil } from 'rxjs';
import { Character } from '../../character/character';
import { CharacterStorageService } from '../../services/character-storage.service';
import { CharacterStateService } from '../../character/characterStateService';
import { ResourceTracker, Resource } from '../../components/resource-tracker/resource-tracker';
import { SkillType } from '../../character/skills/skillTypes';
import { ALL_TALENT_PATHS, getTalentTree } from '../../character/talents/talentTrees/talentTrees';
import { TalentTree } from '../../character/talents/talentInterface';

@Component({
  selector: 'app-character-sheet-view',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatTabsModule,
    ResourceTracker
  ],
  templateUrl: './character-sheet-view.html',
  styleUrl: './character-sheet-view.scss',
})
export class CharacterSheetView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  character: Character | null = null;
  characterId: string = '';
  sessionNotes: string = '';

  // Resources for tracker components
  healthResource: Resource = { name: 'Health', current: 0, max: 0, icon: 'favorite', color: '#f44336' };
  focusResource: Resource = { name: 'Focus', current: 0, max: 0, icon: 'psychology', color: '#2196f3' };
  investitureResource: Resource = { name: 'Investiture', current: 0, max: 0, icon: 'auto_awesome', color: '#9c27b0' };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private characterStorage: CharacterStorageService,
    private characterState: CharacterStateService
  ) {}

  ngOnInit(): void {
    // Check if we have a character ID in the route
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.characterId = params['id'];
          this.loadCharacter(this.characterId);
        } else {
          // Use current character from state service
          this.characterState.character$
            .pipe(takeUntil(this.destroy$))
            .subscribe(character => {
              if (character) {
                this.character = character;
                this.updateResources();
                this.sessionNotes = (character as any).sessionNotes || '';
              }
            });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCharacter(id: string): void {
    this.characterStorage.loadCharacter(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((character: Character | null) => {
        if (character) {
          this.character = character;
          this.characterState.updateCharacter(character);
          this.updateResources();
          this.sessionNotes = (character as any).sessionNotes || '';
        }
      });
  }

  private updateResources(): void {
    if (!this.character) return;

    this.healthResource = {
      name: 'Health',
      current: this.character.resources.health.current,
      max: this.character.resources.health.max,
      icon: 'favorite',
      color: '#f44336'
    };

    this.focusResource = {
      name: 'Focus',
      current: this.character.resources.focus.current,
      max: this.character.resources.focus.max,
      icon: 'psychology',
      color: '#2196f3'
    };

    this.investitureResource = {
      name: 'Investiture',
      current: this.character.resources.investiture.current,
      max: this.character.resources.investiture.max,
      icon: 'auto_awesome',
      color: '#9c27b0'
    };
  }

  onResourceChanged(resourceName: string, newValue: number): void {
    if (!this.character) return;

    switch (resourceName) {
      case 'Health':
        // Direct assignment since we can't call restore with negative values easily
        (this.character.resources.health as any).currentValue = newValue;
        break;
      case 'Focus':
        (this.character.resources.focus as any).currentValue = newValue;
        break;
      case 'Investiture':
        (this.character.resources.investiture as any).currentValue = newValue;
        break;
    }

    this.autoSave();
  }

  saveCharacter(): void {
    if (!this.character) return;

    // Save session notes to character
    (this.character as any).sessionNotes = this.sessionNotes;

    this.characterStorage.saveCharacter(this.character)
      .pipe(takeUntil(this.destroy$))
      .subscribe((result: { success: boolean; id: string }) => {
        if (result.success) {
          console.log('Character saved successfully:', result.id);
          this.characterId = result.id;
        }
      });
  }

  private autoSave(): void {
    // Debounced auto-save could be implemented here
    // For now, just save immediately
    this.saveCharacter();
  }

  exportCharacter(): void {
    if (!this.character) return;
    this.characterStorage.exportCharacter(this.character);
  }

  backToList(): void {
    this.router.navigate(['/character-list']);
  }

  getTrainedSkills(): Array<{name: string, rank: number, total: number}> {
    const trainedSkills: Array<{name: string, rank: number, total: number}> = [];
    if (this.character?.skills) {
      try {
        const skillRanks = this.character.skills.getAllSkillRanks();
        
        Object.entries(skillRanks).forEach(([skillType, rank]: [string, any]) => {
          if (rank > 0) {
            const skillEnum = skillType as SkillType;
            const total = this.character!.skills.getAllSkillTotals(this.character!.attributes)[skillEnum];
            trainedSkills.push({
              name: this.formatSkillName(skillType),
              rank: rank,
              total: total
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

  getTalentName(talentId: string): string {
    const allTrees: TalentTree[] = [];
    
    Object.values(ALL_TALENT_PATHS).forEach(path => {
      if (path.talentNodes) {
        allTrees.push({ pathName: path.name, nodes: path.talentNodes });
      }
      allTrees.push(...path.paths);
    });
    
    const ancestryTree = getTalentTree('singer');
    if (ancestryTree) {
      allTrees.push(ancestryTree);
    }
    
    for (const tree of allTrees) {
      const talent = tree.nodes.find(n => n.id === talentId);
      if (talent) {
        return talent.name;
      }
    }
    
    return talentId.split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  }

  getTalentIds(): string[] {
    return Array.from(this.character?.unlockedTalents || []);
  }
}

