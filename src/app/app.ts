import { Component, HostListener, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet } from '@angular/router';
import { SidenavView } from "./views/sidenav-view/sidenav-view";
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
//import { clearLocalStorage } from './ngrx';     For when I finally get around to making persistent state
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatButtonModule,
    SidenavView,
],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('project-sanderson');
  isMobile: boolean = false;

  constructor() {
    this.checkMobile();
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
