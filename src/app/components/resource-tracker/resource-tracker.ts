import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface Resource {
  name: string;
  current: number;
  max: number;
  icon?: string;
  color?: string;
}

@Component({
  selector: 'app-resource-tracker',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './resource-tracker.html',
  styleUrl: './resource-tracker.scss',
})
export class ResourceTracker {
  @Input() resource!: Resource;
  @Output() valueChanged = new EventEmitter<number>();

  get percentage(): number {
    if (this.resource.max === 0) return 0;
    return (this.resource.current / this.resource.max) * 100;
  }

  get barColor(): string {
    if (this.resource.color) return this.resource.color;
    
    const percentage = this.percentage;
    if (percentage > 66) return '#4caf50'; // Green
    if (percentage > 33) return '#ff9800'; // Orange
    return '#f44336'; // Red
  }

  increment(amount: number = 1): void {
    const newValue = Math.min(this.resource.current + amount, this.resource.max);
    this.resource.current = newValue;
    this.valueChanged.emit(newValue);
  }

  decrement(amount: number = 1): void {
    const newValue = Math.max(this.resource.current - amount, 0);
    this.resource.current = newValue;
    this.valueChanged.emit(newValue);
  }

  setToMax(): void {
    this.resource.current = this.resource.max;
    this.valueChanged.emit(this.resource.max);
  }

  setToZero(): void {
    this.resource.current = 0;
    this.valueChanged.emit(0);
  }
}
