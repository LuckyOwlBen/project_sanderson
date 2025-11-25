import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-view',
  imports: [],
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
}
