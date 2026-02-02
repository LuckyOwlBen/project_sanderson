import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { CharacterIdentityService } from '../../services/character-identity.service';

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
    private characterIdentity: CharacterIdentityService
  ) {}
  
  async newCharacter() {
    try {
      await this.characterIdentity.newIdentity();
      // Navigate to ancestry page once identity is ready
      this.router.navigateByUrl('/character-creator-view/ancestry');
    } catch (error) {
      console.error('[Landing] Error creating new character:', error);
      // Stay on landing page, user can try again
    }
  }

  loadCharacter() {
    this.router.navigateByUrl('/load-character')
  }

  viewSheet() {
    this.router.navigateByUrl('/character-sheet')
  }
}
