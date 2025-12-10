import { Component, OnInit, OnDestroy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet, ActivatedRoute } from '@angular/router';
import { CharacterStateService } from '../../character/characterStateService';
import { CharacterCreationFlowService, CreationStep } from '../../services/character-creation-flow-service';
import { StepValidationService } from '../../services/step-validation.service';
import { ALL_TALENT_PATHS, getTalentTree } from '../../character/talents/talentTrees/talentTrees';
import { TalentTree } from '../../character/talents/talentInterface';
import { MatCard, MatCardHeader, MatCardTitle, MatCardContent } from "@angular/material/card";
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { filter, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-character-creator-view',
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    CommonModule,
    RouterOutlet,
    MatButtonModule,
  ],
  templateUrl: './character-creator-view.html',
  styleUrl: './character-creator-view.scss',
})
export class CharacterCreatorView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  steps: CreationStep[];
  currentStep: number = 0;

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    public characterState: CharacterStateService,
    public flowService: CharacterCreationFlowService,
    private validationService: StepValidationService
  ) {
    this.steps = this.flowService.getSteps();
  }

    ngOnInit(): void {
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
      const firstStepRoute = this.flowService.getStepRoute(0);
      if (firstStepRoute) {
        this.router.navigate([firstStepRoute], { relativeTo: this.activatedRoute });
      }
    }

    // Listen to route changes and update flow service
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.flowService.setCurrentStepByRoute(this.router.url);
    });

    // Subscribe to character changes to validate all steps and trigger change detection
    this.characterState.character$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(character => {
      // Validate all steps whenever character changes
      this.validationService.validateAllSteps(character);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  nextStep(): void {
    if (this.flowService.canGoNext()) {
      const nextIndex = this.flowService.getCurrentStep() + 1;
      const nextRoute = this.flowService.getStepRoute(nextIndex);
      if (nextRoute) {
        console.log('Navigating to next step route:', nextRoute);
        this.router.navigate([nextRoute], { relativeTo: this.activatedRoute });
      }
    }
  }

  previousStep(): void {
    if (this.flowService.canGoPrevious()) {
      const prevIndex = this.flowService.getCurrentStep() - 1;
      const prevRoute = this.flowService.getStepRoute(prevIndex);
      if (prevRoute) {
        this.router.navigate([prevRoute], { relativeTo: this.activatedRoute });
      }
    }
  }

  canGoNext(): boolean {
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
}

