import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { getTalentPath } from '../../character/talents/talentTrees/talentTrees';
import { TalentPath, TalentTree } from '../../character/talents/talentInterface';
import { StepValidationService } from '../../services/step-validation.service';

export interface PathOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
  specializations?: string[];
}

@Component({
  selector: 'app-path-selector',
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './path-selector.html',
  styleUrl: './path-selector.scss',
})
export class PathSelector implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly STEP_INDEX = 6;
  
  character: Character | null = null;
  selectedMainPath: string | null = null;
  selectedSpecialization: string | null = null;
  availableSpecializations: TalentTree[] = [];
  maxPaths: number = 1;

  availablePaths: PathOption[] = [
    {
      id: 'warrior',
      name: 'Warrior',
      description: 'Masters of combat and physical prowess.',
      icon: 'shield'
    },
    {
      id: 'scholar',
      name: 'Scholar',
      description: 'Students of knowledge and artifice.',
      icon: 'school'
    },
    {
      id: 'hunter',
      name: 'Hunter',
      description: 'Trackers and precision specialists.',
      icon: 'gps_fixed'
    },
    {
      id: 'leader',
      name: 'Leader',
      description: 'Inspirers and commanders.',
      icon: 'groups'
    },
    {
      id: 'envoy',
      name: 'Envoy',
      description: 'Diplomats and spiritual guides.',
      icon: 'record_voice_over'
    },
    {
      id: 'agent',
      name: 'Agent',
      description: 'Shadowy operatives and investigators.',
      icon: 'visibility'
    }
  ];

  constructor(
    private characterState: CharacterStateService,
    private validationService: StepValidationService
  ) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
        // Load existing paths - expect format like ["warrior", "Soldier"]
        if (character.paths.length >= 2) {
          this.selectedMainPath = character.paths[0];
          this.selectedSpecialization = character.paths[1];
          
          // Load specializations for the selected main path
          const talentPath = getTalentPath(this.selectedMainPath);
          if (talentPath) {
            this.availableSpecializations = talentPath.paths;
          }
        } else if (character.paths.length === 1) {
          // Legacy format or incomplete selection
          this.selectedSpecialization = character.paths[0];
        }
        this.updateValidation();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectMainPath(pathId: string): void {
    this.selectedMainPath = pathId;
    this.selectedSpecialization = null;
    
    // Load specializations for this path
    const talentPath = getTalentPath(pathId);
    if (talentPath) {
      this.availableSpecializations = talentPath.paths;
    } else {
      this.availableSpecializations = [];
    }
  }

  selectSpecialization(spec: TalentTree): void {
    this.selectedSpecialization = spec.pathName;
    this.updateCharacterPaths();
  }

  isMainPathSelected(pathId: string): boolean {
    return this.selectedMainPath === pathId;
  }

  isSpecializationSelected(specName: string): boolean {
    return this.selectedSpecialization === specName;
  }

  backToMainPath(): void {
    this.selectedMainPath = null;
    this.selectedSpecialization = null;
    this.availableSpecializations = [];
    this.updateValidation();
  }

  private updateCharacterPaths(): void {
    if (this.character && this.selectedSpecialization) {
      // Store the main path name and specialization
      this.character.paths = [this.selectedMainPath!, this.selectedSpecialization];
      this.characterState.updateCharacter(this.character);
      this.updateValidation();
    }
  }

  private updateValidation(): void {
    const isValid = this.selectedSpecialization !== null;
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
  }

  getPathIcon(path: PathOption): string {
    return path.icon || 'star';
  }

  getPathName(pathId: string): string {
    const path = this.availablePaths.find(p => p.id === pathId);
    return path?.name || pathId;
  }
}
