import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Ancestry } from '../../character/ancestry/ancestry';
import { CharacterStateService } from '../../character/characterStateService';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

interface AncestryInfo {
  type: Ancestry;
  title: string;
  shortDesc: string;
  fullDesc: string;
  features: string[];
  imagePlaceholder: string;
}

@Component({
  selector: 'app-ancestry-selector',
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
  ],
  templateUrl: './ancestry-selector.html',
  styleUrl: './ancestry-selector.scss',
})
export class AncestrySelector implements OnInit {
  selectedAncestry: Ancestry | null = null;
  Ancestry = Ancestry; // Expose enum to template

  ancestries: AncestryInfo[] = [
    {
      type: Ancestry.HUMAN,
      title: 'Human',
      shortDesc: 'The most common people of Roshar',
      fullDesc: 'Humans are the dominant species on Roshar, having arrived on the world long ago. They inhabit every corner of the planet, from the storm-battered eastern kingdoms to the sheltered western lands of Shinovar. Humans display tremendous diversity in culture, appearance, and ambition.',
      features: [
        'Versatile and adaptable to any role',
        'Can pursue any path or profession',
        'Most common ancestry across Roshar',
        'Wide variety of cultures and traditions'
      ],
      imagePlaceholder: 'account_circle'
    },
    {
      type: Ancestry.SINGER,
      title: 'Singer',
      shortDesc: 'Ancient inhabitants with the ability to change forms',
      fullDesc: 'Singers are humanoid beings with distinctive carapace armor and the extraordinary ability to assume different forms during highstorms by bonding with spren. Once called parshendi or parshmen, they are the original inhabitants of Roshar. In their various forms, singers can adapt their physical and mental capabilities to suit different roles in society.',
      features: [
        'Can change forms during highstorms',
        'Natural carapace provides protection',
        'Unique connection to Roshar\'s rhythms',
        'Access to specialized form abilities',
        'Ancient heritage predating humans'
      ],
      imagePlaceholder: 'psychology'
    }
  ];

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
