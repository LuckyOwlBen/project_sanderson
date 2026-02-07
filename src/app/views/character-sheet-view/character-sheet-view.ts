import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
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
import { filter } from 'rxjs/operators';
import { Character } from '../../character/character';
import { CharacterStorageService } from '../../services/character-storage.service';
import { CharacterStateService } from '../../character/characterStateService';
import { WebsocketService } from '../../services/websocket.service';
import { NavFinalizedService } from '../../services/nav-finalized.service';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { LevelUpStatusService } from '../../services/level-up-status.service';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { CharacterPortraitUpload } from '../../components/shared/character-portrait-upload/character-portrait-upload';
import { InventoryView } from '../../components/inventory-view/inventory-view';
import { RadiantPathNotifications } from '../../components/shared/radiant-path-notifications/radiant-path-notifications';
import { CharacterSheetHeader } from '../../components/shared/character-sheet-header/character-sheet-header';
import { CharacterPortraitCard } from '../../components/shared/character-portrait-card/character-portrait-card';
import { CharacterDefensesCard } from '../../components/shared/character-defenses-card/character-defenses-card';
import { CharacterPowersTab } from '../../components/shared/character-powers-tab/character-powers-tab';
import { CharacterResourcesBar } from '../../components/shared/character-resources-bar/character-resources-bar';
import { CharacterSkillsCard } from '../../components/shared/character-skills-card/character-skills-card';
import { CraftingView } from '../../components/crafting-view/crafting-view';
import { FormSelectorComponent } from '../../components/shared/form-selector/form-selector';
import { CompanionDetailComponent } from '../../components/shared/companion-detail/companion-detail.component';
import { InventoryItem } from '../../../../shared/types/inventory';
import { PetCompanion } from '../../character/companions/petCompanion';
import { SkillType } from '../../../../shared/data/skills/skillTypes';
import { ALL_TALENT_PATHS, getTalentTree } from '../../../../shared/data/talents/talentTrees';
import { TalentTree, TalentNode, ActionCostCode } from '../../../../shared/types/talents';
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
    CraftingView,
    FormSelectorComponent,
    CompanionDetailComponent,
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
  @ViewChild(InventoryView) inventoryViewComponent?: InventoryView;
  
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
    private navFinalized: NavFinalizedService,
    private combatService: CombatService,
    private levelUpStatusService: LevelUpStatusService,
    private characterIdentity: CharacterIdentityService,
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
          // Set up event listeners AFTER characterId is known (moved from top of ngOnInit)
          this.setupEventListeners();
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

    // NOTE: Auto-save disabled - relying on WebSocket real-time sync instead
    // Individual module changes (ancestry, skills, etc.) save via their own APIs
    // Character reloads automatically when backend updates occur
    // Only save manually when GM grants occur (items, expertise, level-ups)
  }

  ngOnDestroy(): void {
    // NOTE: No save on destroy - WebSocket sync keeps data current
    // Resources auto-save via debounced emitResourceUpdate
    // Module changes save via individual APIs (ancestry, skills, etc.)
    
    // Emit player leave event
    if (this.characterId) {
      this.websocketService.emitPlayerLeave(this.characterId);
    }

    // Disconnect from WebSocket
    this.websocketService.disconnect();

    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupEventListeners(): void {
    console.log('[Character Sheet] 🔄 Setting up event listeners for characterId:', this.characterId);

    // Listen for item grants
    this.websocketService.itemGrant$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event && this.character && event.characterId === this.characterId) {
          console.log('[Character Sheet] 🎁 Item granted:', event.itemId, 'x', event.quantity);
          const added = this.character.inventory.addItem(event.itemId, event.quantity);
          if (added) {
            this.saveCharacter();
            if (this.inventoryViewComponent) {
              this.inventoryViewComponent.refreshInventoryView();
            }
            console.log('[Character Sheet] 🎁 Sending ack for item:', event.itemId, 'x', event.quantity);
            this.websocketService.ackItemGrant(this.characterId!, event.itemId, event.quantity);
          } else {
            console.warn('[Character Sheet] 🎁 Failed to add item:', event.itemId);
            this.websocketService.ackItemGrant(this.characterId!, event.itemId, event.quantity);
          }
        }
      });

    // Listen for spren grants
    this.websocketService.sprenGrant$
      .pipe(takeUntil(this.destroy$))
      .subscribe(grant => {
        console.log('[Character Sheet] ⭐⭐⭐ SPREN GRANT RECEIVED ⭐⭐⭐');
        console.log('[Character Sheet] ⭐ Spren grant received:', grant);
        console.log('[Character Sheet] ⭐ Current characterId:', this.characterId, 'Grant characterId:', grant?.characterId);
        if (grant && this.characterId && grant.characterId === this.characterId && this.character) {
          if (this.character.radiantPath.hasSpren()) {
            console.log('[Character Sheet] ⭐ Character already has spren - ignoring duplicate grant');
            this.websocketService.ackSprenGrant(this.characterId, grant.order);
            return;
          }
          console.log('[Character Sheet] ⭐ Match! Showing spren notification');
          this.pendingSprenGrant = grant;
          setTimeout(() => {
            if (this.pendingSprenGrant === grant) {
              this.pendingSprenGrant = null;
              this.cdr.detectChanges();
            }
          }, 30000);
          this.cdr.detectChanges();
        } else {
          console.log('[Character Sheet] ⭐ No match - ID mismatch');
        }
      });

    // Listen for expertise grants
    this.websocketService.expertiseGrant$
      .pipe(takeUntil(this.destroy$))
      .subscribe(grant => {
        console.log('[Character Sheet] 📚 Expertise grant received:', grant);
        if (grant && this.characterId && grant.characterId === this.characterId && this.character) {
          const existingExpertises = this.characterState.getSelectedExpertises();
          if (existingExpertises.includes(grant.expertiseName)) {
            console.log('[Character Sheet] 📚 Already has expertise:', grant.expertiseName);
            this.websocketService.ackExpertiseGrant(this.characterId, grant.expertiseName);
            return;
          }
          console.log('[Character Sheet] 📚 Match! Adding expertise:', grant.expertiseName);
          this.pendingExpertiseGrant = grant;
          this.characterState.addExpertise(grant.expertiseName, 'gm', undefined);
          this.saveCharacter();
          this.websocketService.ackExpertiseGrant(this.characterId, grant.expertiseName);
          setTimeout(() => {
            if (this.pendingExpertiseGrant === grant) {
              this.pendingExpertiseGrant = null;
              this.cdr.detectChanges();
            }
          }, 10000);
          this.cdr.detectChanges();
        } else {
          console.log('[Character Sheet] 📚 No match - ID mismatch or missing');
        }
      });

    // Listen for level-up grants
    console.log('[Character Sheet] 🆙 Setting up level-up listener for characterId:', this.characterId);
    this.websocketService.levelUp$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        console.log('[Character Sheet] 🆙🆙🆙 LEVEL-UP EVENT RECEIVED 🆙🆙🆙');
        console.log('[Character Sheet] 🆙 Level-up event:', event);
        console.log('[Character Sheet] 🆙 Current characterId:', this.characterId, 'Event characterId:', event?.characterId);
        if (event && this.characterId && event.characterId === this.characterId && this.character) {
          const expectedNextLevel = this.character.level + 1;
          if (event.newLevel !== expectedNextLevel) {
            console.warn('[Character Sheet] 🆙 Rejecting level-up: expected', expectedNextLevel, 'but got', event.newLevel);
            this.websocketService.ackLevelUp(this.characterId, event.newLevel);
            return;
          }
          console.log('[Character Sheet] 🆙 Applying level-up from', this.character.level, 'to', event.newLevel);
          this.character.level = event.newLevel;
          this.character.pendingLevelPoints += 1;
          this.character.pendingLevel = true;
          console.log('[Character Sheet] 🆙 Set pendingLevel=true, pendingLevelPoints=', this.character.pendingLevelPoints);
          this.saveCharacter();
          this.cdr.detectChanges();
          console.log('[Character Sheet] 🆙 Sending ack for level', event.newLevel);
          this.websocketService.ackLevelUp(this.characterId, event.newLevel);
          
          // Update nav finalized status after level-up ack
          // Level-up resets finalized flags, so reload them from the backend
          this.navFinalized.loadNavFinalized(this.characterId).subscribe(() => {
            console.log('[Character Sheet] 🆙 Updated finalized status from backend after level-up');
          });
        } else {
          console.log('[Character Sheet] 🆙 Ignoring: current level:', this.character?.level, '| event level:', event?.newLevel);
        }
      });

    // Listen for level-up completion and update finalized status
    // We listen for the level-up-ack to know when finalized flags need reset
    // (When level-up completes, finalized flags are reset by backend)

    // Set up highstorm listener
    this.websocketService.highstorm$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        console.log('[Character Sheet] ⚡ Highstorm event:', event);
        if (event) {
          this.isHighstormActive = event.active;
          this.cdr.markForCheck();
        }
      });

    // Set up character-updated listener
    this.websocketService.characterUpdated$
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        console.log('[Character Sheet] 🔄 Character updated event received:', event);
        if (event && event.characterId === this.characterId) {
          console.log('[Character Sheet] 🔄 Match! Reloading character from backend...');
          this.loadCharacter(this.characterId);
        }
      });

    // Set up combat start listener
    const combatStartStream = (this.websocketService as any)?.combatStart$;
    if (combatStartStream && typeof combatStartStream.pipe === 'function') {
      combatStartStream
        .pipe(takeUntil(this.destroy$))
        .subscribe((event: any) => {
          console.log('[Character Sheet] ⚔️ Combat started:', event);
          if (this.characterId) {
            this.combatService.registerPlayer(this.characterId);
            console.log('[Character Sheet] ⚔️ Player registered:', this.characterId);
          }
        });
    }

    console.log('[Character Sheet] ✅ Event listeners configured for characterId:', this.characterId);
  }

  private loadCharacter(id: string): void {
    console.log('[Character Sheet] Loading character with ID:', id);
    // CRITICAL: Always set characterId immediately so event listeners have it
    // even if async operations haven't completed yet
    this.characterId = id;
    
    this.characterStorage.loadCharacter(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe((character: Character | null) => {
        if (character) {
          console.log('[Character Sheet] Character loaded:', {
            name: character.name,
            level: character.level,
            pendingLevel: character.pendingLevel,
            pendingLevelPoints: character.pendingLevelPoints,
            ancestry: character.ancestry
          });
          this.character = character;
          this.characterIdentity.setCurrentCharacterId(id); // Set identity in service for API calls
          this.portraitUrl = (character as any).portraitUrl || null;
          this.characterState.updateCharacter(character);
          this.sessionNotes = (character as any).sessionNotes || '';
          
          // Refresh finalized status from backend so sidenav shows current step indicators
          this.navFinalized.loadNavFinalized(id).subscribe(() => {
            console.log('[Character Sheet] Refreshed finalized status from backend');
          });
          
          // Clear pendingLevel when backend confirms level-up is complete (pendingLevelPoints returned to 0)
          if (character.pendingLevel && character.pendingLevelPoints === 0) {
            console.log('[Character Sheet] 🆙 Level-up complete - clearing pendingLevel flag');
            character.pendingLevel = false;
          }
          
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

    // Use spend/restore methods to adjust resource values
    switch (resourceName) {
      case 'Health':
        this.adjustResource(this.character.resources.health, newValue);
        break;
      case 'Focus':
        this.adjustResource(this.character.resources.focus, newValue);
        break;
      case 'Investiture':
        this.adjustResource(this.character.resources.investiture, newValue);
        break;
    }

    // Check for critical health (immediate update, bypass debounce)
    if (resourceName === 'Health' && newValue === 0 && oldHealth !== 0) {
      this.emitResourceUpdate(); // Immediate
    } else {
      // Trigger debounced update
      this.resourceUpdateSubject.next();
    }

    this.saveCharacter();
  }

  private adjustResource(resource: any, targetValue: number): void {
    const current = resource.current;
    const diff = targetValue - current;

    if (diff > 0) {
      resource.restore(diff);
    } else if (diff < 0) {
      resource.spend(Math.abs(diff));
    }
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
      .subscribe({
        next: (result: { success: boolean; id: string }) => {
          if (result.success) {
            console.log('Character saved successfully:', result.id);
            // CRITICAL: Only update characterId if result.id is defined
            // Avoid overwriting characterId with undefined, which breaks event listeners
            if (result.id) {
              this.characterId = result.id;
            }
          }
        },
        error: (error: unknown) => {
          console.error('[Character Sheet] Error saving character:', error);
        }
      });
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
    this.saveCharacter();
  }

  private emitPlayerJoin(): void {
    if (!this.character) {
      console.warn('[Character Sheet] Cannot emit player-join: character is null');
      return;
    }

    const joinData = {
      characterId: this.characterId,
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
      characterId: this.characterId,
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
    if (!this.character || !this.character.pendingLevel) {
      console.log('[Character Sheet] No pending level-up, cannot navigate');
      return;
    }
    
    const characterId = this.characterIdentity.getCurrentCharacterId();
    if (!characterId) {
      console.log('[Character Sheet] Character ID not set, cannot navigate to level-up');
      return;
    }
    
    console.log('[Character Sheet] Fetching level-up status...');
    // Save character before navigating
    this.saveCharacter();
    
    // Fetch level-up status from backend
    this.levelUpStatusService.getLevelUpStatus(characterId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (status) => {
          if (!status.success) {
            console.error('[Character Sheet] Failed to fetch level-up status:', status.error);
            return;
          }
          
          console.log('[Character Sheet] Level-up status:', status);
          
          // Navigate to first unfinalzed step, or attributes if all finalized
          const targetStep = status.firstUnfinalizedStep || 'attributes';
          console.log('[Character Sheet] Navigating to:', targetStep);
          
          this.router.navigate([`/character-creator-view/${targetStep}`], {
            queryParams: { levelUp: 'true' }
          });
        },
        error: (error) => {
          console.error('[Character Sheet] Error fetching level-up status:', error);
          // Fallback to attributes if API call fails
          this.router.navigate(['/character-creator-view/attributes'], {
            queryParams: { levelUp: 'true' }
          });
        }
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

  getActivePetCompanion(): PetCompanion | undefined {
    if (!this.character) return undefined;
    return this.character.getActivePet();
  }
}