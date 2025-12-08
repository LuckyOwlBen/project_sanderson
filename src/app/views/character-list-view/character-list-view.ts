import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { CharacterStorageService, SavedCharacter } from '../../services/character-storage.service';

@Component({
  selector: 'app-character-list-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './character-list-view.html',
  styleUrl: './character-list-view.scss',
})
export class CharacterListView implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  characters: SavedCharacter[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private characterStorage: CharacterStorageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCharacters();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadCharacters(): void {
    this.loading = true;
    this.error = null;
    
    this.characterStorage.listCharacters()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (characters: SavedCharacter[]) => {
          this.characters = characters;
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading characters:', err);
          this.error = 'Failed to load characters';
          this.loading = false;
        }
      });
  }

  selectCharacter(character: SavedCharacter): void {
    this.router.navigate(['/character-sheet', character.id]);
  }

  deleteCharacter(character: SavedCharacter, event: Event): void {
    event.stopPropagation(); // Prevent card click
    
    if (confirm(`Are you sure you want to delete ${character.name}?`)) {
      this.characterStorage.deleteCharacter(character.id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.loadCharacters(); // Reload list
          },
          error: (err) => {
            console.error('Error deleting character:', err);
            alert('Failed to delete character');
          }
        });
    }
  }

  createNewCharacter(): void {
    this.router.navigate(['/character-creator-view']);
  }

  backToHome(): void {
    this.router.navigate(['/']);
  }

  getCultureNames(character: SavedCharacter): string {
    if (!character.data?.cultures) return '';
    return character.data.cultures.map((c: any) => c.name || c).join(', ');
  }
}
