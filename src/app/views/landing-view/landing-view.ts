import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

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

  constructor(private router: Router) {}
  
  newCharacter() {
    this.router.navigateByUrl('/character-creator-view')
  }

  loadCharacter() {
    this.router.navigateByUrl('/load-character')
  }

  viewSheet() {
    this.router.navigateByUrl('/character-sheet')
  }
}
