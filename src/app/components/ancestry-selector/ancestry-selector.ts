import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Ancestry } from '../../character/ancestry/ancestry';
import { CharacterStateService } from '../../character/characterStateService';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-ancestry-selector',
  imports: [
    MatCardModule,
  ],
  templateUrl: './ancestry-selector.html',
  styleUrl: './ancestry-selector.scss',
})
export class AncestrySelector implements OnInit {
  selectedAncestry: Ancestry | null = null;
  Ancestry = Ancestry; // Expose enum to template

  constructor(private characterState: CharacterStateService, private router: Router) {}

  ngOnInit(): void {
    this.characterState.character$.subscribe(char => {
      this.selectedAncestry = char.ancestry;
    });
  }

  selectAncestry(ancestry: Ancestry): void {
    this.selectedAncestry = ancestry;
    this.characterState.setAncestry(ancestry);
  }

  navigateNext(): void {
    this.router.navigate(['/character-creator-view/culture']);
  }

}
