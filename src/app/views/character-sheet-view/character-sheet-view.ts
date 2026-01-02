import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { Character } from '../../character/character';
import { CharacterStorageService } from '../../services/character-storage.service';
import { CharacterStateService } from '../../character/characterStateService';
import { WebsocketService } from '../../services/websocket.service';
import { CharacterPortraitUpload } from '../../components/shared/character-portrait-upload/character-portrait-upload';
import { InventoryView } from '../../components/inventory-view/inventory-view';
import { RadiantPathNotifications } from '../../components/shared/radiant-path-notifications/radiant-path-notifications';
import { CharacterSheetHeader } from '../../components/shared/character-sheet-header/character-sheet-header';
import { CharacterPortraitCard } from '../../components/shared/character-portrait-card/character-portrait-card';
import { CharacterDefensesCard } from '../../components/shared/character-defenses-card/character-defenses-card';
import { CharacterPowersTab } from '../../components/shared/character-powers-tab/character-powers-tab';
import { CharacterResourcesBar } from '../../components/shared/character-resources-bar/character-resources-bar';
import { SkillType } from '../../character/skills/skillTypes';
import { ALL_TALENT_PATHS, getTalentTree } from '../../character/talents/talentTrees/talentTrees';
import { TalentTree, TalentNode, ActionCostCode } from '../../character/talents/talentInterface';

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
    MatDialogModule,
    MatExpansionModule,
    InventoryView,
    RadiantPathNotifications,
    CharacterSheetHeader,
    CharacterPortraitCard,
    CharacterDefensesCard,
    CharacterPowersTab,
    CharacterResourcesBar
  ],
  templateUrl: './character-sheet-view.html',
  styleUrl: './character-sheet-view.scss',
})
export class CharacterSheetView implements OnInit, OnDestroy {
  activeTab = 0;
  private destroy$ = new Subject<void>();
  private resourceUpdateSubject = new Subject<void>();
  private autoSaveInterval: any = null;
  
  character: Character | null = null;
  characterId: string = '';
  sessionNotes: string = '';
  portraitUrl: string | null = null;
  pendingSprenGrant: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private characterStorage: CharacterStorageService,
    private characterState: CharacterStateService,
    private websocketService: WebsocketService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Connect to WebSocket for session management
    this.websocketService.connect();

    // Wait for WebSocket connection before emitting player-join
    this.websocketService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        if (connected && this.character) {
          // Emit player-join when connection is established and character is loaded
          this.emitPlayerJoin();
        }
      });

    // Check if we have a character ID in the route
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.characterId = params['id'];
          this.loadCharacter(this.characterId);
        }
      });

    // Always subscribe to character state updates (for portrait changes, etc.)
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        if (character && this.character) {
          // Update existing character reference to pick up changes like portrait
          this.character = character;
          this.portraitUrl = (character as any).portraitUrl || null;
          this.cdr.detectChanges();
        } else if (character && !this.character) {
          // Initial load if no character ID in route
          this.character = character;
          this.portraitUrl = (character as any).portraitUrl || null;
          this.sessionNotes = (character as any).sessionNotes || '';
          this.cdr.detectChanges();
        }
      });

    // Set up debounced resource updates for WebSocket (2-3 seconds)
    this.resourceUpdateSubject
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(2500)
      )
      .subscribe(() => {
        this.emitResourceUpdate();
      });

    // Set up auto-save interval (every 30 seconds)
    this.autoSaveInterval = setInterval(() => {
      if (this.character) {
        this.saveCharacter();
      }
    }, 30000);

    // Listen for item grants
    this.websocketService.itemGrant$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (this.character && event.characterId === this.characterId) {
          console.log('[Character Sheet] Item granted:', event.itemId, 'x', event.quantity);
          this.character.inventory.addItem(event.itemId, event.quantity);
          this.saveCharacter();
        }
      });

    // Listen for spren grants
    console.log('[Character Sheet] 🔔 Setting up spren grant listener...');
    this.websocketService.sprenGrant$
      .pipe(takeUntil(this.destroy$))
      .subscribe(grant => {
        console.log('[Character Sheet] ⭐⭐⭐ SPREN GRANT RECEIVED IN CHARACTER SHEET ⭐⭐⭐');
        console.log('[Character Sheet] ⭐ Spren grant received:', grant);
        console.log('[Character Sheet] ⭐ Current character ID:', this.characterId);
        if (this.characterId && grant.characterId === this.characterId) {
          console.log('[Character Sheet] ⭐ Match! Showing spren notification');
          this.pendingSprenGrant = grant;
          // Auto-dismiss after 30 seconds
          setTimeout(() => {
            if (this.pendingSprenGrant === grant) {
              this.pendingSprenGrant = null;
              this.cdr.detectChanges();
            }
          }, 30000);
          this.cdr.detectChanges();
        } else {
          console.log('[Character Sheet] ⭐ No match - character ID mismatch');
        }
      });
  }

  ngOnDestroy(): void {
    // Save character state before leaving
    if (this.character) {
      this.saveCharacter();
    }

    // Emit player leave event
    if (this.characterId) {
      this.websocketService.emitPlayerLeave(this.characterId);
    }

    // Disconnect from WebSocket
    this.websocketService.disconnect();

    // Clear auto-save interval
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCharacter(id: string): void {
    console.log('[Character Sheet] Loading character with ID:', id);
    this.characterStorage.loadCharacter(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((character: Character | null) => {
        if (character) {
          console.log('[Character Sheet] Character loaded:', {
            name: character.name,
            level: character.level,
            ancestry: character.ancestry
          });
          this.character = character;
          this.portraitUrl = (character as any).portraitUrl || null;
          this.characterState.updateCharacter(character);
          this.sessionNotes = (character as any).sessionNotes || '';
          
          // Explicitly trigger change detection after loading
          this.cdr.detectChanges();

          // Emit player-join event if WebSocket is already connected
          if (this.websocketService.isConnected()) {
            console.log('[Character Sheet] WebSocket connected, emitting player-join immediately');
            this.emitPlayerJoin();
          } else {
            console.log('[Character Sheet] WebSocket not connected yet, will emit on connection');
          }
          // Otherwise, the connected$ subscription will handle it
        } else {
          console.warn('[Character Sheet] Character not found, redirecting to landing page');
          this.router.navigate(['/']);
        }
      });
  }



  onResourceChanged(event: { resourceName: string, newValue: number }): void {
    if (!this.character) return;

    const { resourceName, newValue } = event;
    const oldHealth = this.character.resources.health.current;

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

    // Check for critical health (immediate update, bypass debounce)
    if (resourceName === 'Health' && newValue === 0 && oldHealth !== 0) {
      this.emitResourceUpdate(); // Immediate
    } else {
      // Trigger debounced update
      this.resourceUpdateSubject.next();
    }

    this.autoSave();
  }

  saveCharacter(): void {
    if (!this.character) return;

    // Don't save completely empty characters (prevents blank saves after server purge)
    // But allow characters in creation (with ID but no name/ancestry yet)
    const hasId = (this.character as any).id;
    const hasName = this.character.name && this.character.name.trim().length > 0;
    const hasAncestry = this.character.ancestry !== null;
    const hasLevel = this.character.level > 1;
    
    // Only skip save if character has absolutely nothing (not even an ID)
    if (!hasId && !hasName && !hasAncestry && !hasLevel) {
      console.warn('[Character Sheet] Skipping save - character is completely empty');
      return;
    }

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
    if (!this.character) {
      this.router.navigate(['/character-list']);
      return;
    }

    // Simple browser confirm dialog
    const shouldSave = confirm('Do you want to save your character before leaving?');
    
    if (shouldSave) {
      this.characterStorage.saveCharacter(this.character)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (result: { success: boolean; id: string }) => {
            console.log('Character saved before navigation:', result);
            this.router.navigate(['/character-list']);
          },
          error: (err: unknown) => {
            console.error('Error saving character:', err);
            // Navigate anyway
            this.router.navigate(['/character-list']);
          }
        });
    } else {
      // User chose not to save, just navigate
      this.router.navigate(['/character-list']);
    }
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

  onPortraitChanged(imageUrl: string | null): void {
    if (!this.character) return;

    if (imageUrl) {
      (this.character as any).portraitUrl = imageUrl;
      this.portraitUrl = imageUrl;
    } else {
      delete (this.character as any).portraitUrl;
      this.portraitUrl = null;
    }
    this.characterState.updateCharacter(this.character);
    this.autoSave();
  }

  private emitPlayerJoin(): void {
    if (!this.character) {
      console.warn('[Character Sheet] Cannot emit player-join: character is null');
      return;
    }

    const joinData = {
      characterId: this.characterId || (this.character as any).id,
      name: this.character.name || 'Unknown',
      level: this.character.level || 1,
      ancestry: this.character.ancestry,
      health: {
        current: this.character.resources.health.current,
        max: this.character.resources.health.max
      },
      focus: {
        current: this.character.resources.focus.current,
        max: this.character.resources.focus.max
      },
      investiture: {
        current: this.character.resources.investiture.current,
        max: this.character.resources.investiture.max
      }
    };

    console.log('[Character Sheet] Emitting player-join with data:', joinData);
    this.websocketService.emitPlayerJoin(joinData);
  }

  private emitResourceUpdate(): void {
    if (!this.character || !this.characterId) return;

    this.websocketService.emitResourceUpdate({
      characterId: this.characterId || (this.character as any).id,
      health: {
        current: this.character.resources.health.current,
        max: this.character.resources.health.max
      },
      focus: {
        current: this.character.resources.focus.current,
        max: this.character.resources.focus.max
      },
      investiture: {
        current: this.character.resources.investiture.current,
        max: this.character.resources.investiture.max
      }
    });
  }

  onSprenAccepted(): void {
    console.log('[Character Sheet] Spren accepted, saving character');
    this.pendingSprenGrant = null;
    this.characterState.updateCharacter(this.character!);
    this.saveCharacter();
    this.cdr.detectChanges();
  }

  onSprenDismissed(): void {
    console.log('[Character Sheet] Spren grant dismissed');
    this.pendingSprenGrant = null;
  }

  onIdealSpoken(): void {
    console.log('[Character Sheet] First Ideal spoken, saving character');
    this.characterState.updateCharacter(this.character!);
    this.saveCharacter();
    this.cdr.detectChanges();
  }
}

