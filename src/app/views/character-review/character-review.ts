import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';
import { CharacterStorageService } from '../../services/character-storage.service';
import { CharacterImage } from '../../components/shared/character-image/character-image';
import { CharacterPortraitUpload } from '../../components/shared/character-portrait-upload/character-portrait-upload';
import { ALL_TALENT_PATHS, getTalentTree } from '../../character/talents/talentTrees/talentTrees';
import { ExpertiseSource, ExpertiseSourceHelper } from '../../character/expertises/expertiseSource';
import { TalentTree } from '../../character/talents/talentInterface';

@Component({
  selector: 'app-character-review',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    CharacterImage
  ],
  templateUrl: './character-review.html',
  styleUrl: './character-review.scss',
})
export class CharacterReview implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  character: Character | null = null;
  portraitUrl: string | null = null;
  isLevelUpMode: boolean = false;
  isLoadingCharacter: boolean = false;
  characterLoadError: string = '';
  private characterId: string | null = null;

  constructor(
    private activatedRoute: ActivatedRoute,
    private characterState: CharacterStateService,
    private characterStorage: CharacterStorageService,
    private router: Router,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to route params to detect level-up mode and get character ID
    this.activatedRoute.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.isLevelUpMode = params['levelUp'] === 'true';

        // Get character ID from route params or from state
        const character = this.characterState.getCharacter();
        this.characterId = (character as any)?.id || null;

        if (this.characterId) {
          this.fetchCharacterFromApi(this.characterId);
        } else {
          console.warn('[CharacterReview] No character ID found');
          this.syncLocalCharacterState();
        }
      });
  }

  private fetchCharacterFromApi(characterId: string): void {
    console.log('[CharacterReview] Fetching character from API:', characterId);
    this.isLoadingCharacter = true;
    this.characterLoadError = '';
    
    this.characterStorage.loadCharacter(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loaded) => {
          this.isLoadingCharacter = false;
          if (!loaded) {
            console.warn('[CharacterReview] API returned no character for ID:', characterId);
            this.characterLoadError = 'Failed to load character. Character may have been deleted.';
            return;
          }
          this.character = loaded;
          this.portraitUrl = (loaded as any)?.portraitUrl || null;
          this.characterState.updateCharacter(loaded);
          console.log('[CharacterReview] Character loaded from API:', loaded.name);
        },
        error: (err) => {
          this.isLoadingCharacter = false;
          console.error('[CharacterReview] Failed to load character from API:', err);
          this.characterLoadError = 'Failed to load character. Please check your connection.';
          this.syncLocalCharacterState();
        }
      });
  }

  private syncLocalCharacterState(): void {
    // Fallback to whatever is currently in memory
    if (!this.character) {
      this.character = this.characterState.getCharacter();
    }
    if (this.character) {
      this.portraitUrl = (this.character as any)?.portraitUrl || null;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getTrainedSkills(): Array<{name: string, rank: number}> {
    const trainedSkills: Array<{name: string, rank: number}> = [];
    
    if (!this.character) {
      console.log('[CharacterReview] No character available');
      return trainedSkills;
    }

    const skillsData = this.character.skills;
    
    if (!skillsData) {
      console.log('[CharacterReview] Character has no skills data');
      return trainedSkills;
    }

    try {
      // Check if skills is a SkillManager instance (has getAllSkillRanks method)
      if (typeof skillsData.getAllSkillRanks === 'function') {
        console.log('[CharacterReview] Using SkillManager instance');
        const skillRanks = skillsData.getAllSkillRanks();
        Object.entries(skillRanks).forEach(([skillType, rank]: [string, any]) => {
          if (rank > 0) {
            trainedSkills.push({
              name: this.formatSkillName(skillType),
              rank: rank
            });
          }
        });
      } else if (typeof skillsData === 'object') {
        // Fallback: treat as plain object (direct backend data)
        console.log('[CharacterReview] Using plain skills object from backend');
        Object.entries(skillsData).forEach(([skillType, rank]: [string, any]) => {
          const rankNum = Number(rank);
          if (rankNum > 0) {
            trainedSkills.push({
              name: this.formatSkillName(skillType),
              rank: rankNum
            });
          }
        });
      }
      console.log('[CharacterReview] Trained skills found:', trainedSkills.length, trainedSkills);
    } catch (error) {
      console.error('[CharacterReview] Error processing skill ranks:', error);
    }

    return trainedSkills.sort((a, b) => a.name.localeCompare(b.name));
  }

  private formatSkillName(skillType: string): string {
    return skillType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getSelectedExpertises(): ExpertiseSource[] {
    return this.character?.selectedExpertises || [];
  }

  getExpertiseSourceBadge(expertise: ExpertiseSource): string {
    return ExpertiseSourceHelper.getSourceBadge(expertise.source);
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
    if (!this.character) {
      console.error('[CharacterReview] Cannot finalize: No character available');
      return;
    }

    console.log('[CharacterReview] Finalizing character creation:', this.character.name);
    this.isLoadingCharacter = true;
    
    this.characterStorage.saveCharacter(this.character)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result: { success: boolean; id: string }) => {
          this.isLoadingCharacter = false;
          
          if (result.success && result.id) {
            console.log('[CharacterReview] Character creation successful - ID:', result.id);
            // Character creation confirmed as successful - route to character sheet
            this.router.navigate(['/character-sheet', result.id], {
              queryParams: {
                created: 'true' // Flag indicating character was just created
              }
            });
          } else {
            console.error('[CharacterReview] Character save returned success=false');
            this.characterLoadError = 'Failed to finalize character. Please try again.';
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          this.isLoadingCharacter = false;
          console.error('[CharacterReview] Error finalizing character:', err);
          this.characterLoadError = 'Error saving character. Please check your connection and try again.';
          this.cdr.detectChanges();
        }
      });
  }

  openPortraitUpload(): void {
    if (!this.character) return;

    const dialogRef = this.dialog.open(CharacterPortraitUpload, {
      width: '600px',
      data: {
        currentImageUrl: (this.character as any).portraitUrl || null,
        characterId: (this.character as any).id,
        characterName: this.character.name || 'Character'
      }
    });

    dialogRef.afterClosed().subscribe((imageUrl: string | null | undefined) => {
      if (imageUrl !== undefined && this.character) {
        // Defer update to next tick to avoid ExpressionChangedAfterItHasBeenCheckedError
        setTimeout(() => {
          if (!this.character) return;
          
          if (imageUrl) {
            // Store URL without timestamp (add timestamp during display only)
            const urlWithoutTimestamp = imageUrl.split('?')[0];
            (this.character as any).portraitUrl = urlWithoutTimestamp;
            this.portraitUrl = urlWithoutTimestamp;
          } else {
            delete (this.character as any).portraitUrl;
            this.portraitUrl = null;
          }
          this.characterState.updateCharacter(this.character);
          this.cdr.detectChanges(); // Force change detection
        }, 0);
      }
    });
  }

  getPortraitUrl(): string | null {
    return (this.character as any)?.portraitUrl || null;
  }

  getUnlockedTalents(): Array<{name: string, tier: number, description: string}> {
    const talents: Array<{name: string, tier: number, description: string}> = [];
    
    if (this.character?.unlockedTalents && this.character.unlockedTalents.size > 0) {
      this.character.unlockedTalents.forEach((talentId: string) => {
        const talent = this.findTalentById(talentId);
        if (talent) {
          talents.push({
            name: talent.name,
            tier: talent.tier,
            description: talent.description
          });
        }
      });
    }
    
    return talents.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
  }

  private findTalentById(talentId: string): any {
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
        return talent;
      }
    }
    
    return null;
  }

  getTalentName(talentId: string): string {
    const talent = this.findTalentById(talentId);
    if (talent) {
      return talent.name;
    }
    
    // Fallback to formatted ID
    return talentId.split('_').map(w => 
      w.charAt(0).toUpperCase() + w.slice(1)
    ).join(' ');
  }

  hasInventoryItems(): boolean {
    if (!this.character?.inventory) return false;
    const allItems = this.character.inventory.getAllItems();
    const equippedItems = this.character.inventory.getAllEquippedItems();
    const equippedIds = new Set(equippedItems.map(item => item.id));
    return allItems.some(item => !equippedIds.has(item.id));
  }

  hasEquippedItems(): boolean {
    if (!this.character?.inventory) return false;
    return this.character.inventory.getAllEquippedItems().length > 0;
  }

  getInventoryItems(): any[] {
    if (!this.character?.inventory) return [];
    const allItems = this.character.inventory.getAllItems();
    const equippedItems = this.character.inventory.getAllEquippedItems();
    const equippedIds = new Set(equippedItems.map(item => item.id));
    return allItems.filter(item => !equippedIds.has(item.id));
  }

  getEquippedItems(): any[] {
    if (!this.character?.inventory) return [];
    return this.character.inventory.getAllEquippedItems();
  }

  getCurrency(): { broams: number; marks: number; chips: number } {
    if (!this.character?.inventory) {
      return { broams: 0, marks: 0, chips: 0 };
    }
    const totalChips = this.character.inventory.getCurrency();
    const broams = Math.floor(totalChips / 20);
    const marks = Math.floor((totalChips % 20) / 5);
    const chips = totalChips % 5;
    return { broams, marks, chips };
  }

  getTotalWeight(): number {
    if (!this.character?.inventory) return 0;
    return this.character.inventory.getTotalWeight();
  }

  getItemIcon(itemType: string): string {
    const iconMap: { [key: string]: string } = {
      'weapon': 'gavel',
      'armor': 'shield',
      'consumable': 'medical_services',
      'tool': 'build',
      'fabrial': 'blur_on',
      'misc': 'category'
    };
    return iconMap[itemType] || 'inventory_2';
  }
}




