import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { CharacterStateService } from '../../character/characterStateService';
import { CharacterCreationFlowService, CreationStep } from '../../services/character-creation-flow-service';
import { StepValidationService } from '../../services/step-validation.service';
import { LevelUpStatusService } from '../../services/level-up-status.service';
import { NavFinalizedService } from '../../services/nav-finalized.service';
import { CharacterIdentityService } from '../../services/character-identity.service';
import { ALL_TALENT_PATHS, getTalentTree } from '../../../../shared/data/talents/talentTrees';
import { TalentTree } from '../../../../shared/types/talents';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from "@angular/material/card";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { filter, take, takeUntil } from 'rxjs/operators';
import { firstValueFrom, Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-character-creator-view',
  imports: [
    MatCard,
    CommonModule,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './character-creator-view.html',
  styleUrl: './character-creator-view.scss',
})
export class CharacterCreatorView implements OnInit, OnDestroy {
  @ViewChild(RouterOutlet) outlet?: RouterOutlet;
  
  private destroy$ = new Subject<void>();
  
  steps: CreationStep[];
  currentStep: number = 0;
  isLevelUpMode: boolean = false;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public characterState: CharacterStateService,
    public flowService: CharacterCreationFlowService,
    private validationService: StepValidationService,
    private levelUpStatusService: LevelUpStatusService,
    private navFinalized: NavFinalizedService,
    private identityService: CharacterIdentityService
  ) {
    this.steps = this.flowService.getSteps();
  }

    ngOnInit(): void {
    // Check if we're in level-up mode
    this.activatedRoute.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.isLevelUpMode = params['levelUp'] === 'true';
      console.log('[Character Creator] Level-up mode:', this.isLevelUpMode);
      
    });

    // Subscribe to flow service changes and update local property
    this.flowService.currentStep$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(step => {
      this.currentStep = step;
    });

    // Sync flow service with current route on init
    this.flowService.setCurrentStepByRoute(this.router.url);

    // Check if we're at parent route with no child - redirect to first step
    const hasChildRoute = this.activatedRoute.firstChild !== null;
    if (!hasChildRoute) {
      const firstStepRoute = this.isLevelUpMode 
        ? this.getNextLevelUpStep(0) 
        : this.flowService.getStepRoute(0);
      if (firstStepRoute) {
        this.router.navigate([firstStepRoute], { 
          relativeTo: this.activatedRoute,
          queryParamsHandling: 'preserve'
        });
      }
    }

    // Listen to route changes and update flow service
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.flowService.setCurrentStepByRoute(this.router.url);
      // Scroll to top of the page on every step change
      const mainContent = document.querySelector('.app-sidenav-content');
      if (mainContent) {
        mainContent.scrollTo({ top: 0 });
      }
    });

    // Subscribe to character changes to validate all steps and trigger change detection
    this.characterState.character$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(character => {
      // Validate all steps whenever character changes
      this.validationService.validateAllSteps(character);
      
      // Load finalized status from backend
      const charId = character?.id || this.identityService.getCurrentCharacterId();
      if (charId) {
        this.navFinalized.loadNavFinalized(charId).subscribe();
      }
    });
  }

  ngOnDestroy(): void {
    // If we're exiting level-up mode without completing through nextStep(),
    // still complete the level-up to decrement pendingLevelPoints
    if (this.isLevelUpMode) {
      const character = this.characterState.getCharacter();
      if (character && character.pendingLevelPoints > 0) {
        character.pendingLevelPoints -= 1;
        delete character.baselineUnlockedTalents;
        this.characterState.updateCharacter(character);
        console.log('[Character Creator] Level-up auto-completed on view exit, pending points:', character.pendingLevelPoints);
      }
    }
    
    this.destroy$.next();
    this.destroy$.complete();
  }

  async nextStep(): Promise<void> {
    // Persist the current step before navigating to the next
    await this.persistCurrentStep();

    // Reload nav status so the step we just completed turns green (spent)
    await this.refreshNavStatus();

    if (this.isLevelUpMode) {
      // In level-up mode, skip to the next relevant step
      const currentIndex = this.flowService.getCurrentStep();
      const nextRoute = this.getNextLevelUpStep(currentIndex + 1);
      if (nextRoute) {
        console.log('[Character Creator] Navigating to next level-up step:', nextRoute);
        this.router.navigate([nextRoute], { 
          relativeTo: this.activatedRoute,
          queryParamsHandling: 'preserve'
        });
      } else {
        // No more level-up steps, complete level-up
        this.completeLevelUp();
      }
    } else if (this.flowService.canGoNext()) {
      const nextIndex = this.flowService.getCurrentStep() + 1;
      const nextRoute = this.flowService.getStepRoute(nextIndex);
      if (nextRoute) {
        console.log('Navigating to next step route:', nextRoute);
        this.router.navigate([nextRoute], { relativeTo: this.activatedRoute });
      }
    }
  }

  private async persistCurrentStep(): Promise<void> {
    try {
      const active = this.outlet?.isActivated ? (this.outlet!.component as any) : null;
      if (active && typeof active.persistStep === 'function') {
        // Call the routed component's persist hook
        const result = active.persistStep();
        // If the component returns a Promise, await it
        if (result && typeof result.then === 'function') {
          await result;
        }
      }
    } catch (err) {
      console.warn('[Character Creator] Persist hook failed or not available for current step', err);
    }
  }

  /**
   * Reload navigation status from backend after a step persist.
   * This updates the nav cards so completed steps turn green (spent).
   */
  private async refreshNavStatus(): Promise<void> {
    const characterId = this.characterState.getCharacter()?.id || this.identityService.getCurrentCharacterId();
    if (characterId) {
      await firstValueFrom(this.navFinalized.loadNavFinalized(characterId));
    }
  }

  previousStep(): void {
    if (this.isLevelUpMode) {
      // In level-up mode, go back to previous relevant step
      const currentIndex = this.flowService.getCurrentStep();
      const prevRoute = this.getPreviousLevelUpStep(currentIndex - 1);
      if (prevRoute) {
        this.router.navigate([prevRoute], { 
          relativeTo: this.activatedRoute,
          queryParamsHandling: 'preserve'
        });
      }
    } else if (this.flowService.canGoPrevious()) {
      const prevIndex = this.flowService.getCurrentStep() - 1;
      const prevRoute = this.flowService.getStepRoute(prevIndex);
      if (prevRoute) {
        this.router.navigate([prevRoute], { relativeTo: this.activatedRoute });
      }
    }
  }

  /**
   * Get the next step that applies to level-up
   * Checks finalized flags to skip categories that don't need updating
   */
  private getNextLevelUpStep(fromIndex: number): string | null {
    const levelUpSteps = ['attributes', 'skills', 'talents', 'expertise', 'review'];
    
    for (let i = fromIndex; i < this.steps.length; i++) {
      const step = this.steps[i];
      if (levelUpSteps.includes(step.route)) {
        return step.route;
      }
    }
    
    return null;
  }

  /**
   * Get the previous step that applies to level-up
   */
  private getPreviousLevelUpStep(fromIndex: number): string | null {
    const levelUpSteps = ['attributes', 'skills', 'talents', 'review'];
    
    for (let i = fromIndex; i >= 0; i--) {
      const step = this.steps[i];
      if (levelUpSteps.includes(step.route)) {
        return step.route;
      }
    }
    
    return null;
  }

  /**
   * Complete level-up process
   */
  private completeLevelUp(): void {
    const character = this.characterState.getCharacter();
    if (character && character.pendingLevelPoints > 0) {
      character.pendingLevelPoints -= 1;
      
      // Clear baseline talents tracking now that level-up is complete
      delete character.baselineUnlockedTalents;
      
      this.characterState.updateCharacter(character);
      console.log('[Character Creator] Level-up completed, pending points:', character.pendingLevelPoints);
      
      // Navigate back to character sheet and clear levelUp query param
      this.router.navigate(['/character-sheet'], {
        queryParams: {}
      });
    }
  }

  canGoNext(): boolean {
    if (this.isLevelUpMode) {
      // In level-up mode, always allow next (we'll skip irrelevant steps)
      return true;
    }
    return this.flowService.canGoNext();
  }

  canGoPrevious(): boolean {
    return this.flowService.canGoPrevious();
  }

  getTrainedSkills(character: any): Array<{name: string, rank: number}> {
    const trainedSkills: Array<{name: string, rank: number}> = [];
    if (character?.skills) {
      try {
        // Use the public getAllSkillRanks method
        const skillRanks = character.skills.getAllSkillRanks();
        
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
    return trainedSkills;
  }

  private formatSkillName(skillType: string): string {
    return skillType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getCultureNames(character: any): string {
    if (!character?.cultures || character.cultures.length === 0) {
      return 'None';
    }
    return character.cultures.map((c: any) => c.name).join(', ');
  }

  getPathNames(character: any): string {
    if (!character?.paths || character.paths.length === 0) {
      return 'None';
    }
    return character.paths.join(', ');
  }

  getTalentIds(character: any): string[] {
    return Array.from(character.unlockedTalents || []);
  }

  getUnlockedTalents(character: any): Array<{name: string, tier: number}> {
    const talents: Array<{name: string, tier: number}> = [];
    
    if (character?.unlockedTalents && character.unlockedTalents.size > 0) {
      character.unlockedTalents.forEach((talentId: string) => {
        // Find the talent in the talent trees to get its display name and tier
        const talent = this.findTalentById(talentId);
        if (talent) {
          talents.push({
            name: talent.name,
            tier: talent.tier
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

  getExpertiseSourceBadge(source: string): string {
    const badges: { [key: string]: string } = {
      'culture': 'Culture',
      'manual': 'Selected',
      'talent': 'Talent',
      'gm': 'GM Grant'
    };
    return badges[source] || source;
  }
}

