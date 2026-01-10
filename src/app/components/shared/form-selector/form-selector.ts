import { Component, Input, OnInit, Output, EventEmitter, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    CommonModule
  ],
  template: `
    <div class="form-selector">
      <div class="form-field">
        <label class="form-label">Active Singer Form</label>
        <select 
          class="form-select"
          [value]="selectedFormId || ''"
          (change)="onFormSelected($any($event.target).value || undefined)"
          [disabled]="availableForms.length === 0 || !highstormActive">
          
          <option value="" data-testid="no-form-option">
            No Active Form
          </option>
          
          <option 
            *ngFor="let form of availableForms" 
            [value]="form.id"
            [attr.data-form-id]="form.id"
            [title]="form.description">
            {{ form.name }}
          </option>
        </select>
        <div *ngIf="!highstormActive" class="form-hint">Requires a highstorm to change forms</div>
      </div>
      
      <div *ngIf="availableForms.length === 0 && character" class="no-forms-message">
        <p>No Singer forms unlocked. Unlock forms through talents.</p>
        <p class="debug-info">
          <small>Unlocked Singer forms: {{ character.unlockedSingerForms.length }}</small><br>
          <small>Has form talents: {{ hasFormTalents() }}</small>
        </p>
        <button *ngIf="hasFormTalents()" class="refresh-button" (click)="reapplyTalentEffects()">
          Refresh Forms
        </button>
      </div>
      
      <div *ngIf="selectedFormId && activeFormInfo" class="active-form-info">
        <h4>{{ activeFormInfo.name }}</h4>
        <p class="form-description">{{ activeFormInfo.description }}</p>
        <div *ngIf="activeFormInfo.effects && activeFormInfo.effects.length > 0" class="form-effects">
          <h5>Effects:</h5>
          <ul>
            <li *ngFor="let effect of activeFormInfo.effects">{{ effect }}</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .form-selector {
      padding: 16px;
    }

    .form-field {
      width: 100%;
      max-width: 600px;
      margin-bottom: 16px;
    }

    .form-label {
      display: block;
      color: rgba(255, 255, 255, 0.87);
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .form-select {
      width: 100%;
      padding: 12px 16px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.23);
      border-radius: 4px;
      color: rgba(255, 255, 255, 0.87);
      font-size: 1rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .form-select:hover:not(:disabled) {
      border-color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.08);
    }

    .form-select:focus:not(:disabled) {
      border-color: #4ab3e8;
      background: rgba(74, 179, 232, 0.1);
    }

    .form-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .form-select option {
      background: #1e1e1e;
      color: #fff;
    }

    .form-hint {
      margin-top: 4px;
      font-size: 0.75rem;
      color: rgba(255, 255, 255, 0.6);
    }

    .no-forms-message {
      color: #b0b0b0;
      font-style: italic;
      margin-top: 8px;
      padding: 1.5rem;
      background: rgba(255, 255, 255, 0.03);
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .debug-info {
      margin-top: 12px;
      color: #808080;
      font-size: 0.85rem;
    }

    .refresh-button {
      margin-top: 12px;
      padding: 8px 16px;
      background: transparent;
      border: 1px solid #4ab3e8;
      border-radius: 4px;
      color: #4ab3e8;
      font-family: inherit;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .refresh-button:hover {
      background: rgba(74, 179, 232, 0.1);
    }

    .active-form-info {
      margin-top: 24px;
      padding: 20px;
      background: linear-gradient(135deg, rgba(74, 179, 232, 0.08) 0%, rgba(74, 179, 232, 0.03) 100%);
      border-radius: 12px;
      border: 1px solid rgba(74, 179, 232, 0.2);
    }

    .active-form-info h4 {
      margin: 0 0 8px 0;
      color: #4ab3e8;
      font-size: 1.1rem;
      font-weight: 600;
    }

    .form-description {
      margin: 0 0 16px 0;
      color: #c8c8c8;
      line-height: 1.6;
      font-size: 0.95rem;
    }

    .form-effects h5 {
      margin: 0 0 8px 0;
      color: #4ab3e8;
      font-size: 0.95rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .active-form-info ul {
      margin: 0;
      padding-left: 24px;
      color: #e8e8e8;
    }

    .active-form-info li {
      margin: 8px 0;
      line-height: 1.5;
    }
  `]
})
export class FormSelectorComponent implements OnInit, OnDestroy {
  @Input() highstormActive: boolean = false;
  
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
          this.cdr.markForCheck();
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
