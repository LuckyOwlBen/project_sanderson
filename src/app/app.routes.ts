import { Routes } from '@angular/router';
import { LandingView } from './views/landing-view/landing-view';

export const routes: Routes = [
    { path: '', redirectTo: '/home', pathMatch: 'full' },
    { path: 'home', component: LandingView },
];
