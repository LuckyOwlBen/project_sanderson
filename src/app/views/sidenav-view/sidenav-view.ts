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
import { CreationProgressComponent } from '../../components/creation-progress/creation-progress';

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
    CreationProgressComponent,
  ],
  templateUrl: './sidenav-view.html',
  styleUrl: './sidenav-view.scss',
})
export class SidenavView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  character: Character | null = null;
  hasCharacter = false;
  isInCreatorView = false;

  constructor(
    private router: Router,
    private characterState: CharacterStateService
  ) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
        // A character is "active" if it has meaningful data (name or ancestry) and level > 0
        this.hasCharacter = !!character && !!(character.name || character.ancestry) && (character.level || 0) > 0;
      });

    // Track if we're in the character creator view
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.isInCreatorView = this.router.url.includes('/character-creator-view');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  shouldShowNavigationProgress(): boolean {
    // Show navigation grid when character is active and NOT currently in creator view
    return this.hasCharacter && !this.isInCreatorView;
  }
}
