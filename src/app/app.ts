import { Component, HostListener, signal, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { SidenavView } from "./views/sidenav-view/sidenav-view";
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CreationProgressComponent } from './components/creation-progress/creation-progress';
import { CharacterStateService } from './character/characterStateService';
import { Character } from './character/character';
import { ActivatedRoute } from '@angular/router';
//import { clearLocalStorage } from './ngrx';     For when I finally get around to making persistent state
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    SidenavView,
    CreationProgressComponent,
],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('project-sanderson');
  isMobile: boolean = false;
  private destroy$ = new Subject<void>();
  
  character: Character | null = null;
  hasCharacter = false;
  isInCreatorView = false;
  isLevelUpMode = false;

  @ViewChild('drawer') drawer!: MatSidenav;

  constructor(
    private router: Router,
    private characterState: CharacterStateService,
    private activatedRoute: ActivatedRoute
  ) {
    this.checkMobile();
    
    // Close drawer on navigation when in mobile mode
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        if (this.isMobile && this.drawer) {
          this.drawer.close();
        }
        // Track if we're in creator view
        this.isInCreatorView = this.router.url.includes('/character-creator-view');
      });
  }

  ngOnInit(): void {
    // Subscribe to character state
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        this.character = character;
        this.hasCharacter = !!character && !!(character.name || character.ancestry);
      });

    // Track level-up mode from query params
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        // Check if current route has levelUp query param
        const urlTree = this.router.parseUrl(this.router.url);
        this.isLevelUpMode = urlTree.queryParams['levelUp'] === 'true';
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  shouldShowInlineProgress(): boolean {
    // Show inline progress when in creator view
    return this.isInCreatorView && this.hasCharacter;
  }

  shouldShowNavigationGrid(): boolean {
    // Show navigation grid when character is active and NOT in creator view
    return this.hasCharacter && !this.isInCreatorView;
  }

  @HostListener('window:resize')
  onResize() {
    this.checkMobile();
  }

  private checkMobile() {
    this.isMobile = window.innerWidth <= 768;
  }
  
  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: Event) {
   // clearLocalStorage();
  }
}
