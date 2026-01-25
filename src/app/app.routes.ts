import { Routes } from '@angular/router';
import { LandingView } from './views/landing-view/landing-view';
import { CharacterCreatorView } from './views/character-creator-view/character-creator-view';
import { Error404View } from './views/error-404-view/error-404-view';
import { CharacterName } from './components/character-name/character-name';
import { AncestrySelector } from './components/ancestry-selector/ancestry-selector';
import { CultureSelector } from './components/culture-selector/culture-selector';
import { AttributeAllocator } from './components/attribute-allocator/attribute-allocator';
import { SkillManager } from './components/skill-manager/skill-manager';
import { ExpertiseSelector } from './components/expertise-selector/expertise-selector';
import { PathSelector } from './components/path-selector/path-selector';
import { TalentView } from './components/talent-view/talent-view';
import { StartingEquipment } from './components/starting-equipment/starting-equipment';
import { CharacterReview } from './views/character-review/character-review';
import { CharacterSheetView } from './views/character-sheet-view/character-sheet-view';
import { CharacterListView } from './views/character-list-view/character-list-view';
import { GmDashboardView } from './views/gm-dashboard-view/gm-dashboard-view';
import { StoreView } from './views/store-view/store-view';
import { LogsView } from './views/logs-view/logs-view';
import { AttackRollerComponent } from './components/attack-roller/attack-roller.component';

export const routes: Routes = [
  { path: '', component: LandingView },  // Menu: New Game, Load Game, etc.
  { path: 'landing', component: LandingView },
  { path: 'error', component: Error404View },
  { path: 'gm-control-center', component: GmDashboardView },
  { path: 'store', component: StoreView, title: 'General Store' },
  { path: 'test/attack-roller', component: AttackRollerComponent, title: 'Attack Roller Test' },
  { 
    path: 'character-creator-view', 
    component: CharacterCreatorView,
    children: [
        { path: '', redirectTo: 'ancestry', pathMatch: 'full' },
        { path: 'ancestry', component: AncestrySelector, pathMatch: 'full' },
        { path: 'culture', component: CultureSelector, pathMatch: 'full' },
        { path: 'name', component: CharacterName, pathMatch: 'full' },
        { path: 'attributes', component: AttributeAllocator, pathMatch: 'full' },
        { path: 'skills', component: SkillManager, pathMatch: 'full' },
        { path: 'expertises', component: ExpertiseSelector, pathMatch: 'full' },
        { path: 'paths', component: PathSelector, pathMatch: 'full' },
        { path: 'talents', component: TalentView, pathMatch: 'full' },
        { path: 'equipment', component: StartingEquipment, pathMatch: 'full' },
        { path: 'review', component: CharacterReview, pathMatch: 'full' },
    ]},
  { path: 'character-sheet/:id', component: CharacterSheetView },
  { path: 'character-sheet', component: CharacterSheetView },
  { path: 'load-character', component: CharacterListView },
  { path: 'character-list', component: CharacterListView },
  { path: 'logs', component: LogsView },
  { path: '**', redirectTo: '' }
];
