import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CharacterId } from '../../services/character-id';

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
    private characterIdService: CharacterId
  ) {}
  
  newCharacter() {
    // Reset to a brand new character
    this.characterIdService.newId();
    this.router.navigateByUrl('/character-creator-view/ancestry')
  }

  loadCharacter() {
    this.router.navigateByUrl('/load-character')
  }

  viewSheet() {
    this.router.navigateByUrl('/character-sheet')
  }
}
