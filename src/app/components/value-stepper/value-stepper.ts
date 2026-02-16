import { Component, EventEmitter, Input, Output, OnChanges, SimpleChanges, OnInit } from '@angular/core';

@Component({
  selector: 'app-value-stepper',
  imports: [],
  templateUrl: './value-stepper.html',
  styleUrl: './value-stepper.scss',
})
export class ValueStepper implements OnInit, OnChanges {
  @Input() label: string = '';
  @Input() currentValue: number = 0;
  @Input() minValue: number = 0;
  @Input() maxValue: number = 10;
  @Input() pointsRemaining: number = 0;
  
  @Output() valueChanged = new EventEmitter<{label: string, value: number}>();

  private displayValue: number = 0;

  ngOnInit(): void {
    // Initialize display value on component creation
    this.displayValue = this.currentValue;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currentValue']) {
      this.displayValue = changes['currentValue'].currentValue;
    }
  }

  increment(): void {
    if (this.displayValue < this.maxValue && this.pointsRemaining > 0) {
      this.displayValue++;
      this.valueChanged.emit({label: this.label, value: this.displayValue});
    }
  }

  decrement(): void {
    if (this.displayValue > this.minValue) {
      this.displayValue--;
      this.valueChanged.emit({label: this.label, value: this.displayValue});
    }
  }

  get canIncrement(): boolean {
    return this.displayValue < this.maxValue && this.pointsRemaining > 0;
  }

  get canDecrement(): boolean {
    return this.displayValue > this.minValue;
  }

  get display(): number {
    return this.displayValue;
  }
}
