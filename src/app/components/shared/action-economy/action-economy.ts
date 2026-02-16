import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-action-economy',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatTooltipModule],
  template: `
    <div class="action-economy" [class.interactive]="interactive">
      <div class="economy-section">
        <span class="label">Actions:</span>
        <div class="action-dots">
          @for (action of actionArray; track $index) {
            <div 
              class="dot action-dot"
              [class.used]="$index < actionsUsed"
              [matTooltip]="$index < actionsUsed ? 'Action Used' : 'Action Available'"
              (click)="onActionClick($index)"
            >
              <mat-icon>{{ $index < actionsUsed ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
            </div>
          }
        </div>
      </div>

      <div class="economy-section">
        <span class="label">Reaction:</span>
        <div class="action-dots">
          <div 
            class="dot reaction-dot"
            [class.used]="reactionUsed"
            [matTooltip]="reactionUsed ? 'Reaction Used' : 'Reaction Available'"
            (click)="onReactionClick()"
          >
            <mat-icon>{{ reactionUsed ? 'check_circle' : 'radio_button_unchecked' }}</mat-icon>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .action-economy {
      display: flex;
      gap: 20px;
      align-items: center;
      padding: 8px 12px;
      background: rgba(0, 0, 0, 0.03);
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .economy-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .label {
      font-size: 13px;
      font-weight: 600;
      color: #666;
    }

    .action-dots {
      display: flex;
      gap: 6px;
    }

    .dot {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .interactive .dot {
      cursor: pointer;
    }

    .interactive .dot:hover {
      transform: scale(1.1);
    }

    .action-dot mat-icon {
      color: #2196f3;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .action-dot.used mat-icon {
      color: #4caf50;
    }

    .reaction-dot mat-icon {
      color: #ff9800;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .reaction-dot.used mat-icon {
      color: #f44336;
    }

    .dot:not(.used) {
      opacity: 0.6;
    }

    .dot.used {
      opacity: 1;
    }
  `]
})
export class ActionEconomyComponent {
  @Input() maxActions: number = 3;
  @Input() actionsUsed: number = 0;
  @Input() reactionUsed: boolean = false;
  @Input() interactive: boolean = false;

  @Output() actionUsed = new EventEmitter<void>();
  @Output() reactionUsedEvent = new EventEmitter<void>();

  get actionArray(): number[] {
    return Array(this.maxActions).fill(0);
  }

  onActionClick(index: number): void {
    if (!this.interactive) return;
    
    if (index === this.actionsUsed && this.actionsUsed < this.maxActions) {
      this.actionUsed.emit();
    }
  }

  onReactionClick(): void {
    if (!this.interactive) return;
    
    if (!this.reactionUsed) {
      this.reactionUsedEvent.emit();
    }
  }
}
