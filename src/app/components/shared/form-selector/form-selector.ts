import { Component, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { CharacterStateService } from '../../../character/characterStateService';
import { Character } from '../../../character/character';
import { UniversalAbility } from '../../../character/abilities/universalAbilities';
import { applyTalentEffects } from '../../../character/talents/talentEffects';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-form-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatButtonModule
  ],
  template: `
    <div class="form-selector">
      <mat-form-field appearance="outline" class="form-field">
        <mat-label>Active Singer Form</mat-label>
        <mat-select 
          [value]="selectedFormId"
          (selectionChange)="onFormSelected($event.value)"
          [disabled]="availableForms.length === 0">
          
          <mat-option [value]="undefined" data-testid="no-form-option">
            No Active Form
          </mat-option>
          
          <mat-option 
            *ngFor="let form of availableForms" 
            [value]="form.id"
            [attr.data-form-id]="form.id"
            [matTooltip]="form.description">
            {{ form.name }}
          </mat-option>
        </mat-select>
      </mat-form-field>
      
      <div *ngIf="availableForms.length === 0 && character" class="no-forms-message">
        <p>No Singer forms unlocked. Unlock forms through talents.</p>
        <p class="debug-info">
          <small>Unlocked Singer forms: {{ character.unlockedSingerForms.length }}</small><br>
          <small>Has form talents: {{ hasFormTalents() }}</small>
        </p>
        <button *ngIf="hasFormTalents()" mat-stroked-button color="primary" (click)="reapplyTalentEffects()">
          Refresh Forms
        </button>
      </div>
      
      <div *ngIf="selectedFormId && activeFormInfo" class="active-form-info">
        <h4>{{ activeFormInfo.name }} Bonuses</h4>
        <ul>
          <li *ngFor="let effect of activeFormInfo.effects">{{ effect }}</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .form-selector {
      padding: 16px;
    }

    .form-field {
      width: 100%;
      max-width: 400px;
    }

    .no-forms-message {
      color: #666;
      font-style: italic;
      margin-top: 8px;
    }

    .debug-info {
      margin-top: 8px;
      color: #999;
    }

    button {
      margin-top: 12px;
    }

    .active-form-info {
      margin-top: 16px;
      padding: 12px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }

    .active-form-info h4 {
      margin: 0 0 8px 0;
      color: #ffd700;
    }

    .active-form-info ul {
      margin: 0;
      padding-left: 20px;
    }

    .active-form-info li {
      margin: 4px 0;
    }
  `]
})
export class FormSelectorComponent implements OnInit, OnDestroy {
  selectedFormId?: string;
  availableForms: UniversalAbility[] = [];
  activeFormInfo?: UniversalAbility;
  character?: Character;
  private destroy$ = new Subject<void>();

  @Output() formChanged = new EventEmitter<string | undefined>();

  constructor(
    private characterState: CharacterStateService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe((character: Character) => {
        if (character) {
          this.character = character;
          this.availableForms = character.getAvailableForms();
          this.selectedFormId = character.activeForm;
          this.activeFormInfo = character.getActiveFormInfo();
          // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
          setTimeout(() => this.cdr.detectChanges(), 0);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFormSelected(formId: string | undefined): void {
    if (this.character) {
      this.character.setActiveForm(formId);
      this.selectedFormId = formId;
      this.activeFormInfo = this.character.getActiveFormInfo();
      this.formChanged.emit(formId);
      this.characterState.updateCharacter(this.character);
    }
  }

  hasFormTalents(): boolean {
    if (!this.character) return false;
    const formTalents = ['forms_of_finesse', 'forms_of_wisdom', 'forms_of_resolve', 
                         'forms_of_destruction', 'forms_of_expansion', 'forms_of_mystery'];
    return Array.from(this.character.unlockedTalents).some((t: string) => formTalents.includes(t));
  }

  reapplyTalentEffects(): void {
    if (!this.character) return;
    
    // Re-apply talent effects for all unlocked talents
    for (const talentId of Array.from(this.character.unlockedTalents)) {
      applyTalentEffects(this.character, talentId);
    }
    
    // Update the view
    this.availableForms = this.character.getAvailableForms();
    this.characterState.updateCharacter(this.character);
  }
}
