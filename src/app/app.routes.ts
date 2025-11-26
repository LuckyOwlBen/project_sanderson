import { Routes } from '@angular/router';
import { LandingView } from './views/landing-view/landing-view';
import { CharacterCreatorView } from './views/character-creator-view/character-creator-view';
import { AncestrySelector } from './components/ancestry-selector/ancestry-selector';
import { CultureSelector } from './components/culture-selector/culture-selector';

export const routes: Routes = [
  { path: '', component: LandingView },  // Menu: New Game, Load Game, etc.
  { path: 'landing', component: LandingView },
  { 
    path: 'character-creator-view', 
    component: CharacterCreatorView,
    children: [
        { path: '', redirectTo: 'ancestry', pathMatch: 'full' },
        { path: 'ancestry', component: AncestrySelector, pathMatch: 'full' },
        { path: 'culture', component: CultureSelector, pathMatch: 'full' },
    ]},
  /**{ 
    path: 'character-creator', 
    component: CharacterCreatorView,
    children: [
      { path: '', redirectTo: 'ancestry', pathMatch: 'full' },
      { path: 'ancestry', component: AncestrySelector },
      { path: 'culture', component: CultureSelector },
      { path: 'attributes', component: AttributeAllocator },
      { path: 'skills', component: SkillSelector },
      { path: 'talents', component: TalentTreeViewer },
      { path: 'review', component: CharacterReview }
    ]
  },
  { path: 'character-sheet/:id', component: CharacterSheetView },
  { path: 'load-character', component: LoadCharacterView }, **/
  { path: '**', redirectTo: '' }
];
