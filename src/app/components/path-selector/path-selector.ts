import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { Subject, takeUntil, filter, take } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { getTalentPath } from '../../../../shared/data/talents/talentTrees';
import { TalentPath, TalentTree } from '../../../../shared/types/talents';
import { StepValidationService } from '../../services/step-validation.service';
import { LevelUpApiService } from '../../services/levelup-api.service';
import { CharacterStorageService } from '../../services/character-storage.service';
import { PathsApiService } from '../../services/paths-api.service';
import { CharacterIdentityService } from '../../services/character-identity.service';

export interface PathOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
  specializations?: string[];
}

@Component({
  selector: 'app-path-selector',
  imports: [CommonModule, MatCardModule, MatButtonModule, MatChipsModule, MatIconModule],
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
  isLoading: boolean = false;
  isWaitingForIdentity: boolean = false;

  availablePaths: PathOption[] = [
    {
      id: 'warrior',
      name: 'Warrior',
      description: 'Masters of combat and physical prowess.',
      icon: 'shield',
    },
    {
      id: 'scholar',
      name: 'Scholar',
      description: 'Students of knowledge and artifice.',
      icon: 'school',
    },
    {
      id: 'hunter',
      name: 'Hunter',
      description: 'Trackers and precision specialists.',
      icon: 'gps_fixed',
    },
    {
      id: 'leader',
      name: 'Leader',
      description: 'Inspirers and commanders.',
      icon: 'groups',
    },
    {
      id: 'envoy',
      name: 'Envoy',
      description: 'Diplomats and spiritual guides.',
      icon: 'record_voice_over',
    },
    {
      id: 'agent',
      name: 'Agent',
      description: 'Shadowy operatives and investigators.',
      icon: 'visibility',
    },
  ];

  constructor(
    private activatedRoute: ActivatedRoute,
    private characterState: CharacterStateService,
    private validationService: StepValidationService,
    private levelUpApi: LevelUpApiService,
    private storageService: CharacterStorageService,
    private pathsApiService: PathsApiService,
    private identityService: CharacterIdentityService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Monitor the waiting flag from identity service
    this.identityService.waitingForIdentity$.pipe(takeUntil(this.destroy$)).subscribe((waiting) => {
      this.isWaitingForIdentity = waiting;
    });

    // Subscribe to route params to detect level-up mode
    this.activatedRoute.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.isLevelUpMode = params['levelUp'] === 'true';
    });

    // Once we have a character ID, load paths from API
    this.identityService.currentCharacterId$
      .pipe(
        takeUntil(this.destroy$),
        filter((id) => id !== null)
      )
      .subscribe((characterId) => {
        if (characterId) {
          this.loadPathsFromApi(characterId);
        }
      });
  }

  private loadPathsFromApi(characterId: string): void {
    console.log('[PathSelector] Loading paths from API for character:', characterId);
    this.pathsApiService
      .getPaths(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (paths) => {
          console.log('[PathSelector] Received paths from API:', paths);
          if (paths.type && paths.sub) {
            this.selectedMainPath = paths.type;
            this.selectedSpecialization = paths.sub;

            // Load specializations for the selected main path
            const talentPath = getTalentPath(paths.type);
            if (talentPath) {
              this.availableSpecializations = talentPath.paths;
            }
          } else {
            this.selectedMainPath = null;
            this.selectedSpecialization = null;
          }
          this.updateValidation();
          this.isWaitingForIdentity = false;
          console.log(
            '[PathSelector] Updated paths:',
            this.selectedMainPath,
            this.selectedSpecialization
          );
        },
        error: (err) => {
          console.error('[PathSelector] Error loading paths from API:', err);
          this.selectedMainPath = null;
          this.selectedSpecialization = null;
          this.updateValidation();
          this.isWaitingForIdentity = false;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  selectMainPath(pathId: string): void {
    // Ensure path ID is lowercase for consistent backend lookup
    this.selectedMainPath = pathId.toLowerCase();
    this.selectedSpecialization = null;

    // Load specializations for this path
    const talentPath = getTalentPath(pathId.toLowerCase());
    if (talentPath) {
      this.availableSpecializations = talentPath.paths;
    } else {
      this.availableSpecializations = [];
    }
  }

  selectSpecialization(spec: TalentTree): void {
    // Store ID (lowercase) instead of display name for consistent backend lookup
    this.selectedSpecialization = spec.pathName.toLowerCase();
    this.updateValidation();
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

  private updateValidation(): void {
    const isValid = this.selectedSpecialization !== null;
    this.validationService.setStepValid(this.STEP_INDEX, isValid);
  }

  getPathIcon(path: PathOption): string {
    return path.icon || 'star';
  }

  getPathName(pathId: string): string {
    const path = this.availablePaths.find((p) => p.id === pathId);
    return path?.name || pathId;
  }

  // Persist hook for CharacterCreatorView
  public persistStep(): Promise<void> {
    console.log('[PathSelector] persistStep called');
    return new Promise((resolve, reject) => {
      this.identityService.currentCharacterId$.pipe(take(1)).subscribe((characterId) => {
        if (!characterId) {
          console.warn('[PathSelector] No character ID available for saving');
          resolve();
          return;
        }

        if (!this.selectedMainPath || !this.selectedSpecialization) {
          console.warn('[PathSelector] No path selection to save');
          resolve();
          return;
        }

        console.log(
          '[PathSelector] Saving paths:',
          this.selectedMainPath,
          this.selectedSpecialization,
          'for character:',
          characterId
        );
        this.isLoading = true;
        this.pathsApiService
          .savePaths(characterId, this.selectedMainPath, this.selectedSpecialization)
          .subscribe({
            next: (response) => {
              console.log('[PathSelector] Paths saved to server:', response);
              this.isLoading = false;
              resolve();
            },
            error: (error) => {
              console.error('[PathSelector] Failed to save paths:', error);
              this.isLoading = false;
              reject(error);
            },
          });
      });
    });
  }
}
