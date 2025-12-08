import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CharacterStateService } from '../../character/characterStateService';
import { Character } from '../../character/character';

@Component({
  selector: 'app-landing-view',
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule
  ],
  templateUrl: './landing-view.html',
  styleUrl: './landing-view.scss',
})
export class LandingView {

  constructor(
    private router: Router,
    private characterState: CharacterStateService
  ) {}
  
  newCharacter() {
    // Reset to a brand new character
    const freshCharacter = new Character();
    this.characterState.updateCharacter(freshCharacter);
    this.router.navigateByUrl('/character-creator-view/ancestry')
  }

  loadCharacter() {
    this.router.navigateByUrl('/load-character')
  }

  viewSheet() {
    this.router.navigateByUrl('/character-sheet')
  }
}
