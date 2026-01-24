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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { Character } from '../../character/character';
import { CharacterStorageService } from '../../services/character-storage.service';
import { CharacterStateService } from '../../character/characterStateService';
import { WebsocketService } from '../../services/websocket.service';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { CharacterPortraitUpload } from '../../components/shared/character-portrait-upload/character-portrait-upload';
import { InventoryView } from '../../components/inventory-view/inventory-view';
import { RadiantPathNotifications } from '../../components/shared/radiant-path-notifications/radiant-path-notifications';
import { CharacterSheetHeader } from '../../components/shared/character-sheet-header/character-sheet-header';
import { CharacterPortraitCard } from '../../components/shared/character-portrait-card/character-portrait-card';
import { CharacterDefensesCard } from '../../components/shared/character-defenses-card/character-defenses-card';
import { CharacterPowersTab } from '../../components/shared/character-powers-tab/character-powers-tab';
import { CharacterResourcesBar } from '../../components/shared/character-resources-bar/character-resources-bar';
import { CharacterSkillsCard } from '../../components/shared/character-skills-card/character-skills-card';
import { SkillRoller } from '../../components/shared/skill-roller/skill-roller';
import { CraftingView } from '../../components/crafting-view/crafting-view';
import { FormSelectorComponent } from '../../components/shared/form-selector/form-selector';
import { PetDisplayComponent } from '../../components/shared/pet-display/pet-display.component';
import { InventoryItem } from '../../character/inventory/inventoryItem';
import { SkillType } from '../../character/skills/skillTypes';
import { ALL_TALENT_PATHS, getTalentTree } from '../../character/talents/talentTrees/talentTrees';
import { TalentTree, TalentNode, ActionCostCode } from '../../character/talents/talentInterface';
import { CombatTurnSpeedSelectorComponent } from "../../components/combat-turn-speed-selector/combat-turn-speed-selector.component";
import { CombatService } from "../../services/combat.service";

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
    MatDialogModule,
    MatExpansionModule,
    InventoryView,
    RadiantPathNotifications,
    CharacterSheetHeader,
    CharacterPortraitCard,
    CharacterDefensesCard,
    CharacterPowersTab,
    CharacterResourcesBar,
    CharacterSkillsCard,
    SkillRoller,
    CraftingView,
    FormSelectorComponent,
    PetDisplayComponent,
    CombatTurnSpeedSelectorComponent
],
  templateUrl: './character-sheet-view.html',
  styleUrl: './character-sheet-view.scss',
})
export class CharacterSheetView implements OnInit, OnDestroy {
  activeTab = 0;
  equipmentActiveTab: 'inventory' | 'crafting' | 'companions' = 'inventory';
  private destroy$ = new Subject<void>();
  private resourceUpdateSubject = new Subject<void>();
  private autoSaveInterval: any = null;
  
  character: Character | null = null;
  characterId: string = '';
  sessionNotes: string = '';
  portraitUrl: string | null = null;
  pendingSprenGrant: any = null;
  pendingExpertiseGrant: any = null;
  isHighstormActive: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private characterStorage: CharacterStorageService,
    private characterState: CharacterStateService,
    private websocketService: WebsocketService,
    private combatService: CombatService,
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

    // Subscribe to route params - load character from route only
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        if (params['id']) {
          this.characterId = params['id'];
          this.loadCharacter(this.characterId);
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
        if (event && this.character && event.characterId === this.characterId) {
          console.log('[Character Sheet] 🎁 Item granted:', event.itemId, 'x', event.quantity);
          
          // Add item (inventory.addItem is already idempotent - it stacks or adds new instance)
          const added = this.character.inventory.addItem(event.itemId, event.quantity);
          
          if (added) {
            this.saveCharacter();
            console.log('[Character Sheet] 🎁 Sending ack for item:', event.itemId, 'x', event.quantity);
            this.websocketService.ackItemGrant(this.characterId!, event.itemId, event.quantity);
          } else {
            console.warn('[Character Sheet] 🎁 Failed to add item:', event.itemId);
            // Still ack to prevent infinite retry of invalid items
            this.websocketService.ackItemGrant(this.characterId!, event.itemId, event.quantity);
          }
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
        if (grant && this.characterId && grant.characterId === this.characterId && this.character) {
          // Check if already has spren (idempotency)
          if (this.character.radiantPath.hasSpren()) {
            console.log('[Character Sheet] ⭐ Character already has spren - ignoring duplicate grant');
            // Still ack to clear from server queue
            this.websocketService.ackSprenGrant(this.characterId, grant.order);
            return;
          }

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

    // Listen for expertise grants
    console.log('[Character Sheet] 📚 Setting up expertise grant listener...');
    console.log('[Character Sheet] 📚 Current character ID:', this.characterId);
    this.websocketService.expertiseGrant$
      .pipe(takeUntil(this.destroy$))
      .subscribe(grant => {
        console.log('[Character Sheet] 📚📚📚 EXPERTISE GRANT RECEIVED IN SUBSCRIBE 📚📚📚');
        console.log('[Character Sheet] 📚 Expertise grant received:', grant);
        console.log('[Character Sheet] 📚 Current character ID:', this.characterId);
        console.log('[Character Sheet] 📚 Grant character ID:', grant?.characterId);
        if (grant && this.characterId && grant.characterId === this.characterId && this.character) {
          // Check if already has expertise (idempotency)
          const existingExpertises = this.characterState.getSelectedExpertises();
          if (existingExpertises.includes(grant.expertiseName)) {
            console.log('[Character Sheet] 📚 Character already has expertise:', grant.expertiseName, '- ignoring duplicate');
            // Still ack to clear from server queue
            this.websocketService.ackExpertiseGrant(this.characterId, grant.expertiseName);
            return;
          }

          console.log('[Character Sheet] 📚 Match! Adding expertise:', grant.expertiseName);
          this.pendingExpertiseGrant = grant;
          
          // Auto-add expertise and save
          this.characterState.addExpertise(grant.expertiseName, 'gm', undefined);
          this.saveCharacter();

          // Send acknowledgment
          console.log('[Character Sheet] 📚 Sending ack for expertise:', grant.expertiseName);
          this.websocketService.ackExpertiseGrant(this.characterId, grant.expertiseName);
          
          // Auto-dismiss notification after 10 seconds
          setTimeout(() => {
            if (this.pendingExpertiseGrant === grant) {
              this.pendingExpertiseGrant = null;
              this.cdr.detectChanges();
            }
          }, 10000);
          this.cdr.detectChanges();
        } else {
          console.log('[Character Sheet] 📚 No match - character ID mismatch or missing');
        }
      });
    console.log('[Character Sheet] 📚 Expertise grant listener subscription complete');

    // Listen for level-up grants
    console.log('[Character Sheet] 🆙 Setting up level-up listener...');
    this.websocketService.levelUp$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        console.log('[Character Sheet] 🆙🆙🆙 LEVEL-UP EVENT RECEIVED 🆙🆙🆙');
        console.log('[Character Sheet] 🆙 Level-up event:', event);
        if (event && this.characterId && event.characterId === this.characterId && this.character) {
          // Defensive guard: only accept level-up if newLevel is exactly current + 1
          // This prevents burst grants from a mismatched queue state
          const expectedNextLevel = this.character.level + 1;
          if (event.newLevel !== expectedNextLevel) {
            console.warn('[Character Sheet] 🆙 Rejecting level-up: expected level', expectedNextLevel, 'but got', event.newLevel);
            this.websocketService.ackLevelUp(this.characterId, event.newLevel);
            return;
          }

          console.log('[Character Sheet] 🆙 Applying level increment from', this.character.level, 'to', event.newLevel);
          this.character.level = event.newLevel;
          this.character.pendingLevelPoints += 1;
          this.saveCharacter();
          this.cdr.detectChanges();

          // Acknowledge receipt
          console.log('[Character Sheet] 🆙 Sending ack for level', event.newLevel);
          this.websocketService.ackLevelUp(this.characterId, event.newLevel);
        } else {
          console.log('[Character Sheet] 🆙 Ignoring duplicate/old level-up event (current:', this.character?.level, 'event:', event?.newLevel, ')');
        }
      });
    console.log('[Character Sheet] 🆙 Level-up listener subscription complete');
    
    // Set up highstorm listener
    console.log('[Character Sheet] ⚡ Setting up highstorm listener...');
    this.websocketService.highstorm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        console.log('[Character Sheet] ⚡ Highstorm event:', event);
        if (event) {
          this.isHighstormActive = event.active;
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
    console.log('[Character Sheet] ⚡ Highstorm listener subscription complete');

    // Set up combat start listener
    console.log('[Character Sheet] ⚔️ Setting up combat start listener...');
    const combatStartStream = (this.websocketService as any)?.combatStart$;
    if (combatStartStream && typeof combatStartStream.pipe === 'function') {
      combatStartStream
        .pipe(takeUntil(this.destroy$))
        .subscribe((event: any) => {
          console.log('[Character Sheet] ⚔️ Combat started event received:', event);
          if (this.characterId) {
            // Register this character for combat
            this.combatService.registerPlayer(this.characterId);
            console.log('[Character Sheet] ⚔️ Player registered for combat:', this.characterId);
          }
        });
    }
    console.log('[Character Sheet] ⚔️ Combat start listener subscription complete');
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
          this.characterId = id; // Ensure characterId is set from route
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
    if (this.pendingSprenGrant && this.characterId) {
      // Send acknowledgment to server
      this.websocketService.ackSprenGrant(this.characterId, this.pendingSprenGrant.order);
    }
    this.pendingSprenGrant = null;
    this.characterState.updateCharacter(this.character!);
    this.saveCharacter();
    this.cdr.detectChanges();
  }

  onSprenDismissed(): void {
    console.log('[Character Sheet] Spren grant dismissed');
    if (this.pendingSprenGrant && this.characterId) {
      // Still ack even on dismiss so server knows we received it
      this.websocketService.ackSprenGrant(this.characterId, this.pendingSprenGrant.order);
    }
    this.pendingSprenGrant = null;
  }

  onIdealSpoken(): void {
    console.log('[Character Sheet] First Ideal spoken, saving character');
    // Investiture is already unlocked in the notification component
    // Just update state and save
    this.characterState.updateCharacter(this.character!);
    this.saveCharacter();
    this.cdr.detectChanges();
  }

  dismissExpertiseGrant(): void {
    console.log('[Character Sheet] Expertise grant dismissed');
    this.pendingExpertiseGrant = null;
    this.cdr.detectChanges();
  }

  navigateToLevelUp(): void {
    if (!this.character || this.character.pendingLevelPoints <= 0) {
      return;
    }
    
    console.log('[Character Sheet] Navigating to level-up screen');
    // Save character before navigating
    this.saveCharacter();
    
    // Determine the first valid level-up step
    const levelUpManager = new LevelUpManager();
    const attributePoints = levelUpManager.getAttributePointsForLevel(this.character.level || 1);
    
    // Start with skills if no attribute points, otherwise start with attributes
    const firstStep = attributePoints > 0 ? 'attributes' : 'skills';
    
    // Navigate to character creator with level-up mode
    this.router.navigate([`/character-creator-view/${firstStep}`], {
      queryParams: { levelUp: 'true' }
    });
  }

  getEquippedPet(): InventoryItem | null {
    if (!this.character) return null;
    
    const equippedAccessory = this.character.inventory.getEquippedItem('accessory');
    if (equippedAccessory && equippedAccessory.type === 'pet') {
      return equippedAccessory;
    }
    return null;
  }
}