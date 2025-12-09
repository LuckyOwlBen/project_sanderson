import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatExpansionModule } from '@angular/material/expansion';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';

interface CreationStep {
  label: string;
  icon: string;
  stepNumber: number;
  completed: boolean;
}

@Component({
  selector: 'app-sidenav-view',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
    MatExpansionModule,
  ],
  templateUrl: './sidenav-view.html',
  styleUrl: './sidenav-view.scss',
})
export class SidenavView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  character: Character | null = null;
  creationSteps: CreationStep[] = [];
  hasCharacter = false;

  constructor(
    private router: Router,
    private characterState: CharacterStateService
  ) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
        this.hasCharacter = !!character;
        this.updateCreationSteps();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  navigateToStep(stepNumber: number): void {
    const stepRoutes = ['ancestry', 'culture', 'name', 'attributes', 'skills', 'paths', 'talents', 'review'];
    const route = stepRoutes[stepNumber];
    if (route) {
      this.router.navigate(['/character-creator-view', route]);
    }
  }

  private updateCreationSteps(): void {
    if (!this.character) {
      this.creationSteps = [];
      return;
    }

    this.creationSteps = [
      {
        label: 'Ancestry',
        icon: 'groups',
        stepNumber: 0,
        completed: !!this.character.ancestry
      },
      {
        label: 'Culture',
        icon: 'public',
        stepNumber: 1,
        completed: this.character.cultures && this.character.cultures.length > 0
      },
      {
        label: 'Name',
        icon: 'badge',
        stepNumber: 2,
        completed: !!this.character.name && this.character.name.length > 0
      },
      {
        label: 'Attributes',
        icon: 'fitness_center',
        stepNumber: 3,
        completed: this.hasAttributesAssigned()
      },
      {
        label: 'Skills',
        icon: 'school',
        stepNumber: 4,
        completed: this.hasSkillsAssigned()
      },
      {
        label: 'Path',
        icon: 'explore',
        stepNumber: 5,
        completed: this.character.paths && this.character.paths.length > 0
      },
      {
        label: 'Talents',
        icon: 'stars',
        stepNumber: 6,
        completed: this.character.unlockedTalents && this.character.unlockedTalents.size > 0
      },
      {
        label: 'Review',
        icon: 'check_circle',
        stepNumber: 7,
        completed: this.isCharacterComplete()
      }
    ];
  }

  private hasAttributesAssigned(): boolean {
    if (!this.character?.attributes) return false;
    const attrs = this.character.attributes;
    return attrs.strength > 0 || attrs.speed > 0 || attrs.intellect > 0 ||
           attrs.willpower > 0 || attrs.awareness > 0 || attrs.presence > 0;
  }

  private hasSkillsAssigned(): boolean {
    if (!this.character?.skills) return false;
    try {
      const skillRanks = this.character.skills.getAllSkillRanks();
      return Object.values(skillRanks).some((rank: any) => rank > 0);
    } catch {
      return false;
    }
  }

  private isCharacterComplete(): boolean {
    // Don't mark Review as complete initially - it's the final step
    return false;
  }
}
