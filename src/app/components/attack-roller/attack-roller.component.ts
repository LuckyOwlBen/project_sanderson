/**
 * Attack Roller Component
 * 
 * Demonstrates integrated attack rolling with backend API.
 * - Calculates d20 rolls on backend
 * - Compares against target defense
 * - Calculates damage on hit
 * - Shows detailed breakdown
 */

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { BackendCalculationsService } from '../../services/backend-calculations.service';

interface AttackResult {
  attackRoll: {
    finalRoll: number;
    rollsGenerated: number[];
    skillModifier: number;
    bonusModifiers: number;
    total: number;
    isCritical: boolean;
    isFumble: boolean;
  };
  damageRoll: {
    diceNotation: string;
    diceRolls: number[];
    diceTotal: number;
    bonuses: number;
    total: number;
  };
  combat: {
    vsDefense: number;
    attackTotal: number;
    isHit: boolean;
    isCritical: boolean;
    hitMargin: number;
    damageDealt: number;
    hitDescription: string;
  };
}

@Component({
  selector: 'app-attack-roller',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatSelectModule
  ],
  template: `
    <div class="attack-roller-container">
      <mat-card class="attack-setup-card">
        <mat-card-header>
          <mat-card-title>Attack Roll Tester</mat-card-title>
          <mat-card-subtitle>Backend API Integration Test</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="input-grid">
            <!-- Skill Total Input -->
            <mat-form-field>
              <mat-label>Skill Total</mat-label>
              <input matInput type="number" [(ngModel)]="skillTotal" placeholder="e.g., 8">
              <mat-hint>d20 + skill + bonuses</mat-hint>
            </mat-form-field>

            <!-- Bonus Modifiers Input -->
            <mat-form-field>
              <mat-label>Bonus Modifiers</mat-label>
              <input matInput type="number" [(ngModel)]="bonusModifiers" placeholder="e.g., 2">
              <mat-hint>Additional bonuses</mat-hint>
            </mat-form-field>

            <!-- Damage Notation Input -->
            <mat-form-field>
              <mat-label>Damage Notation</mat-label>
              <input matInput [(ngModel)]="damageNotation" placeholder="e.g., d6+1">
              <mat-hint>Format: XdY+Z (e.g., 2d6+2, d8-1)</mat-hint>
            </mat-form-field>

            <!-- Damage Bonus Input -->
            <mat-form-field>
              <mat-label>Damage Bonus</mat-label>
              <input matInput type="number" [(ngModel)]="damageBonus" placeholder="e.g., 0">
              <mat-hint>Additional damage</mat-hint>
            </mat-form-field>

            <!-- Target Defense Input -->
            <mat-form-field>
              <mat-label>Target Defense</mat-label>
              <input matInput type="number" [(ngModel)]="targetDefense" placeholder="e.g., 12">
              <mat-hint>Enemy defense to beat</mat-hint>
            </mat-form-field>

            <!-- Advantage Mode Select -->
            <mat-form-field>
              <mat-label>Advantage Mode</mat-label>
              <mat-select [(ngModel)]="advantageMode">
                <mat-option value="normal">Normal</mat-option>
                <mat-option value="advantage">Advantage (2d20 best)</mat-option>
                <mat-option value="disadvantage">Disadvantage (2d20 worst)</mat-option>
              </mat-select>
              <mat-hint>Roll mode</mat-hint>
            </mat-form-field>
          </div>

          <!-- Roll Button -->
          <div class="button-group">
            <button 
              mat-raised-button 
              color="primary"
              (click)="rollAttack()"
              [disabled]="loading">
              <mat-icon>casino</mat-icon>
              {{ loading ? 'Rolling...' : 'Roll Attack' }}
            </button>

            <!-- Attack Combination Button -->
            <button 
              mat-raised-button 
              color="accent"
              (click)="rollAttackCombination()"
              [disabled]="loading">
              <mat-icon>multiple_stop</mat-icon>
              {{ loading ? 'Rolling...' : 'Roll 3 Attacks' }}
            </button>

            <button 
              mat-raised-button
              (click)="resetForm()">
              <mat-icon>refresh</mat-icon>
              Reset
            </button>
          </div>

          <!-- Error Display -->
          <div class="error-message" *ngIf="error">
            <mat-icon>error</mat-icon>
            {{ error }}
          </div>
        </mat-card-content>
      </mat-card>

      <!-- Attack Result Display -->
      <mat-card class="attack-result-card" *ngIf="lastResult">
        <mat-card-header>
          <mat-card-title>Attack Result</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <!-- Combat Summary -->
          <div class="result-section combat-summary">
            <h3>Combat Summary</h3>
            <div class="summary-row" [class.hit]="lastResult.combat.isHit" [class.miss]="!lastResult.combat.isHit">
              <span class="label">Result:</span>
              <span class="value">{{ lastResult.combat.hitDescription }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Attack Total:</span>
              <span class="value">{{ lastResult.combat.attackTotal }}</span>
            </div>
            <div class="summary-row">
              <span class="label">vs Defense:</span>
              <span class="value">{{ lastResult.combat.vsDefense }}</span>
            </div>
            <div class="summary-row">
              <span class="label">Hit Margin:</span>
              <span class="value" [class.positive]="lastResult.combat.hitMargin >= 0" [class.negative]="lastResult.combat.hitMargin < 0">
                {{ lastResult.combat.hitMargin >= 0 ? '+' : '' }}{{ lastResult.combat.hitMargin }}
              </span>
            </div>
            <div class="summary-row" *ngIf="lastResult.combat.isHit">
              <span class="label">Damage Dealt:</span>
              <span class="value critical" *ngIf="lastResult.combat.isCritical">⚡ {{ lastResult.combat.damageDealt }} (CRITICAL)</span>
              <span class="value" *ngIf="!lastResult.combat.isCritical">{{ lastResult.combat.damageDealt }}</span>
            </div>
          </div>

          <!-- Attack Roll Breakdown -->
          <div class="result-section attack-breakdown">
            <h3>Attack Roll</h3>
            <div class="breakdown-row">
              <span class="label">d20 Roll:</span>
              <span class="value">{{ lastResult.attackRoll.finalRoll }}</span>
            </div>
            <div class="breakdown-row">
              <span class="label">Skill Modifier:</span>
              <span class="value">+{{ lastResult.attackRoll.skillModifier }}</span>
            </div>
            <div class="breakdown-row">
              <span class="label">Bonus Modifiers:</span>
              <span class="value">+{{ lastResult.attackRoll.bonusModifiers }}</span>
            </div>
            <div class="breakdown-row total">
              <span class="label">Total:</span>
              <span class="value">{{ lastResult.attackRoll.total }}</span>
            </div>
            <div class="special-info" *ngIf="lastResult.attackRoll.isCritical">
              ⭐ Critical Hit (Natural 20)!
            </div>
            <div class="special-info" *ngIf="lastResult.attackRoll.isFumble">
              💀 Fumble (Natural 1)!
            </div>
          </div>

          <!-- Damage Roll Breakdown -->
          <div class="result-section damage-breakdown" *ngIf="lastResult.combat.isHit">
            <h3>Damage Roll</h3>
            <div class="breakdown-row">
              <span class="label">Dice Notation:</span>
              <span class="value">{{ lastResult.damageRoll.diceNotation }}</span>
            </div>
            <div class="breakdown-row">
              <span class="label">Dice Rolls:</span>
              <span class="value">[{{ lastResult.damageRoll.diceRolls.join(', ') }}] = {{ lastResult.damageRoll.diceTotal }}</span>
            </div>
            <div class="breakdown-row">
              <span class="label">Bonuses:</span>
              <span class="value">+{{ lastResult.damageRoll.bonuses }}</span>
            </div>
            <div class="breakdown-row total">
              <span class="label">Total Damage:</span>
              <span class="value" [class.critical]="lastResult.combat.isCritical">
                {{ lastResult.damageRoll.total }}{{ lastResult.combat.isCritical ? ' (doubled for critical)' : '' }}
              </span>
            </div>
          </div>

          <!-- Advantage Mode Info -->
          <div class="result-section advantage-info" *ngIf="advantageMode !== 'normal'">
            <h3>{{ advantageMode === 'advantage' ? 'Advantage' : 'Disadvantage' }} Roll</h3>
            <div class="breakdown-row">
              <span class="label">Rolls:</span>
              <span class="value">[{{ lastResult.attackRoll.rollsGenerated.join(', ') }}]</span>
            </div>
            <div class="breakdown-row">
              <span class="label">Kept:</span>
              <span class="value">{{ lastResult.attackRoll.finalRoll }} ({{ advantageMode === 'advantage' ? 'highest' : 'lowest' }})</span>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .attack-roller-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }

    mat-card {
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .input-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 20px;
    }

    mat-form-field {
      width: 100%;
    }

    .button-group {
      display: flex;
      gap: 10px;
      margin-top: 20px;
    }

    button {
      flex: 1;
    }

    .error-message {
      color: #f44336;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 15px;
      padding: 10px;
      background-color: #ffebee;
      border-radius: 4px;
    }

    .result-section {
      margin-bottom: 20px;
      padding: 15px;
      background-color: #f5f5f5;
      border-radius: 4px;
    }

    .result-section h3 {
      margin: 0 0 15px 0;
      color: #1976d2;
      font-size: 16px;
    }

    .summary-row,
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
    }

    .summary-row:last-child,
    .breakdown-row:last-child {
      border-bottom: none;
    }

    .breakdown-row.total {
      font-weight: bold;
      padding-top: 10px;
      border-top: 2px solid #1976d2;
    }

    .label {
      font-weight: 500;
      color: #424242;
    }

    .value {
      color: #1976d2;
      font-weight: 600;
    }

    .value.positive {
      color: #4caf50;
    }

    .value.negative {
      color: #f44336;
    }

    .value.critical {
      color: #ff6f00;
      font-size: 1.1em;
    }

    .summary-row.hit {
      background-color: #c8e6c9;
      border-radius: 4px;
      padding: 10px;
    }

    .summary-row.miss {
      background-color: #ffcdd2;
      border-radius: 4px;
      padding: 10px;
    }

    .special-info {
      margin-top: 10px;
      padding: 10px;
      background-color: #fff3e0;
      border-left: 4px solid #ff6f00;
      border-radius: 2px;
      font-weight: 500;
    }

    .advantage-info {
      background-color: #e3f2fd;
    }
  `]
})
export class AttackRollerComponent implements OnInit, OnDestroy {
  // Form inputs
  skillTotal: number = 8;
  bonusModifiers: number = 2;
  damageNotation: string = 'd6+1';
  damageBonus: number = 0;
  targetDefense: number = 12;
  advantageMode: 'normal' | 'advantage' | 'disadvantage' = 'normal';

  // State
  loading: boolean = false;
  error: string | null = null;
  lastResult: AttackResult | null = null;

  private destroy$ = new Subject<void>();

  constructor(private backendCalc: BackendCalculationsService) {}

  ngOnInit(): void {
    console.log('[AttackRoller] Component initialized, backend API ready');
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Roll a single attack
   */
  async rollAttack(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const response = await this.backendCalc.executeAttackAsync(
        this.skillTotal,
        this.bonusModifiers,
        this.damageNotation,
        this.damageBonus,
        this.targetDefense,
        this.advantageMode
      );

      if (response.success && response.attack) {
        this.lastResult = response.attack;
        console.log('[AttackRoller] Attack roll successful:', this.lastResult);
      } else {
        this.error = response.error || 'Unknown error occurred';
      }
    } catch (err: any) {
      this.error = err.error?.error || err.message || 'Failed to execute attack';
      console.error('[AttackRoller] Attack roll failed:', err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Roll multiple attacks
   */
  async rollAttackCombination(): Promise<void> {
    this.loading = true;
    this.error = null;

    try {
      const response = await this.backendCalc.executeAttackCombinationAsync(
        3, // 3 attacks
        this.skillTotal,
        this.bonusModifiers,
        this.damageNotation,
        this.damageBonus,
        this.targetDefense,
        this.advantageMode
      );

      if (response.success && response.combination) {
        // Display first attack as main result
        const firstAttack = response.combination.attacks[0];
        console.log('[AttackRoller] Attack combination:', response.combination);
        console.log('Summary:', {
          attackCount: response.combination.attackCount,
          hitCount: response.combination.summary.hitCount,
          missCount: response.combination.summary.missCount,
          totalDamage: response.combination.summary.totalDamage,
          avgDamage: response.combination.summary.averageDamagePerAttack,
          criticals: response.combination.summary.criticalHits
        });
        this.error = `Rolled 3 attacks: ${response.combination.summary.hitCount} hits, ${response.combination.summary.missCount} misses, ${response.combination.summary.totalDamage} total damage`;
      } else {
        this.error = response.error || 'Failed to execute attack combination';
      }
    } catch (err: any) {
      this.error = err.error?.error || err.message || 'Failed to execute attack combination';
      console.error('[AttackRoller] Attack combination failed:', err);
    } finally {
      this.loading = false;
    }
  }

  /**
   * Reset form to defaults
   */
  resetForm(): void {
    this.skillTotal = 8;
    this.bonusModifiers = 2;
    this.damageNotation = 'd6+1';
    this.damageBonus = 0;
    this.targetDefense = 12;
    this.advantageMode = 'normal';
    this.lastResult = null;
    this.error = null;
  }
}
