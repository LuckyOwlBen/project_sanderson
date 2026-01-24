import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { getTalentPath } from '../../character/talents/talentTrees/talentTrees';
import { TalentPath, TalentTree } from '../../character/talents/talentInterface';
import { StepValidationService } from '../../services/step-validation.service';
import { LevelUpApiService } from '../../services/levelup-api.service';
import { CharacterStorageService } from '../../services/character-storage.service';

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
  isLevelUpMode: boolean = false;
  private characterId: string | null = null;

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
    private activatedRoute: ActivatedRoute,
    private characterState: CharacterStateService,
    private validationService: StepValidationService,
    private levelUpApi: LevelUpApiService,
    private storageService: CharacterStorageService
  ) {}

  ngOnInit(): void {
    // Subscribe to route params to detect level-up mode and always
    // fetch a fresh character snapshot from the backend by ID.
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isLevelUpMode = params['levelUp'] === 'true';

        // Read the current character snapshot to get the ID, but do not
        // subscribe to character$ (avoids stale state re-emits).
        this.character = this.characterState.getCharacter();
        this.characterId = (this.character as any)?.id || null;

        if (this.characterId) {
          this.fetchCharacterFromApi(this.characterId);
        } else {
          console.warn('[PathSelector] No character ID found; cannot load from API');
          this.syncLocalCharacterState();
        }
      });
  }

  private fetchCharacterFromApi(characterId: string): void {
    this.storageService.loadCharacter(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loaded) => {
          if (!loaded) {
            console.warn('[PathSelector] API returned no character for ID:', characterId);
            this.syncLocalCharacterState();
            return;
          }
          this.character = loaded;
          this.characterState.updateCharacter(loaded);
          this.loadPathsFromCharacter();
        },
        error: (err) => {
          console.error('[PathSelector] Failed to load character from API:', err);
          this.syncLocalCharacterState();
        }
      });
  }

  private syncLocalCharacterState(): void {
    // Fallback to whatever is currently in memory; still validate so the UI
    // remains usable even if the API call fails or the ID is missing.
    if (!this.character) {
      this.character = this.characterState.getCharacter();
    }
    if (this.character) {
      this.loadPathsFromCharacter();
    }
  }

  private loadPathsFromCharacter(): void {
    if (!this.character) return;
    
    // Load existing paths - expect format like ["warrior", "Soldier"]
    if (this.character.paths.length >= 2) {
      this.selectedMainPath = this.character.paths[0];
      this.selectedSpecialization = this.character.paths[1];
      
      // Load specializations for the selected main path
      const talentPath = getTalentPath(this.selectedMainPath);
      if (talentPath) {
        this.availableSpecializations = talentPath.paths;
      }
    } else if (this.character.paths.length === 1) {
      // Legacy format or incomplete selection
      this.selectedSpecialization = this.character.paths[0];
    }
    this.updateValidation();
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
    this.submitPathsToServer();
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

  private submitPathsToServer(): void {
    if (!this.character || !this.character.id || !this.selectedMainPath || !this.selectedSpecialization) {
      return;
    }

    this.levelUpApi.submitPaths(this.character.id, this.selectedMainPath, this.selectedSpecialization)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          if (resp.unlockedTalent) {
            this.character!.unlockedTalents.add(resp.unlockedTalent);
          }
          // Update paths from server response
          if (resp.paths) {
            this.character!.paths = resp.paths;
          }
          this.characterState.updateCharacter(this.character!);
        },
        error: (err) => {
          console.error('Failed to submit path selection', err);
        }
      });
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

  // Persist hook for CharacterCreatorView
  public persistStep(): void {
    if (this.character && this.characterId) {
      this.storageService.saveCharacter(this.character).subscribe({ next: () => {}, error: () => {} });
    }
  }
}
