import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-error-404-view',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './error-404-view.html',
  styleUrl: './error-404-view.scss',
})
export class Error404View implements OnInit {
  constructor(private router: Router) {}

  ngOnInit(): void {
    // Auto-navigate to landing page after 5 seconds on refresh/direct navigation
    // But allow user to navigate back within that time
    setTimeout(() => {
      if (this.router.url.includes('error')) {
        this.router.navigate(['/']);
      }
    }, 5000);
  }

  navigateHome(): void {
    this.router.navigate(['/']);
  }
}
