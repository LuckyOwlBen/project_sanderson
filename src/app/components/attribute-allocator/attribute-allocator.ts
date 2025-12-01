import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-attribute-allocator',
  imports: [],
  templateUrl: './attribute-allocator.html',
  styleUrl: './attribute-allocator.scss',
})
export class AttributeAllocator {
  @Input() attributeName: string = '';
  @Input() currentValue: number = 0;
  @Input() minValue: number = 0;
  @Input() maxValue: number = 10;
  @Input() pointsRemaining: number = 0;
  
  @Output() valueChanged = new EventEmitter<{attribute: string, value: number}>();

  increment(): void {
    if (this.currentValue < this.maxValue && this.pointsRemaining > 0) {
      this.currentValue++;
      this.valueChanged.emit({attribute: this.attributeName, value: this.currentValue});
    }
  }

  decrement(): void {
    if (this.currentValue > this.minValue) {
      this.currentValue--;
      this.valueChanged.emit({attribute: this.attributeName, value: this.currentValue});
    }
  }

  get canIncrement(): boolean {
    return this.currentValue < this.maxValue && this.pointsRemaining > 0;
  }

  get canDecrement(): boolean {
    return this.currentValue > this.minValue;
  }
}
