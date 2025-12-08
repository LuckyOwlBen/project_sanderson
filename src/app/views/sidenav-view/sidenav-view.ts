import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-sidenav-view',
  imports: [
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatListModule,
  ],
  templateUrl: './sidenav-view.html',
  styleUrl: './sidenav-view.scss',
})
export class SidenavView {
  constructor(private router: Router) {}

  navigateTo(route: string): void {
    this.router.navigate([route]);
  }
}
