import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-sidenav-view',
  imports: [
    MatCardModule,
    MatDividerModule,
  ],
  templateUrl: './sidenav-view.html',
  styleUrl: './sidenav-view.scss',
})
export class SidenavView {

}
