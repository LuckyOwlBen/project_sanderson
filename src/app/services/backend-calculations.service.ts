/**
 * Backend Calculations Service
 * 
 * Provides HTTP access to all backend calculation APIs.
 * Centralizes API communication for:
 * - Attack calculations (rolls, damage, hits)
 * - Defense calculations
 * - Skill calculations
 * - Character calculations
 * - Point allocations
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class BackendCalculationsService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // =========================================================================
  // ATTACK CALCULATIONS
  // =========================================================================

  /**
   * Execute a single attack with all calculations
   */
  executeAttack(
    skillTotal: number,
    bonusModifiers: number,
    damageNotation: string,
    damageBonus: number,
    targetDefense: number,
    advantageMode: 'normal' | 'advantage' | 'disadvantage' = 'normal'
  ): Observable<any> {
    const body = {
      skillTotal,
      bonusModifiers,
      damageNotation,
      damageBonus,
      targetDefense,
      advantageMode
    };
    return this.http.post(`${this.apiUrl}/calculations/attack/execute`, body);
  }

  /**
   * Execute multiple attacks (e.g., full attack action)
   */
  executeAttackCombination(
    attackCount: number,
    skillTotal: number,
    bonusModifiers: number,
    damageNotation: string,
    damageBonus: number,
    targetDefense: number,
    advantageMode: 'normal' | 'advantage' | 'disadvantage' = 'normal'
  ): Observable<any> {
    const body = {
      attackCount,
      skillTotal,
      bonusModifiers,
      damageNotation,
      damageBonus,
      targetDefense,
      advantageMode
    };
    return this.http.post(`${this.apiUrl}/calculations/attack/combination`, body);
  }

  /**
   * Validate attack parameters without executing
   */
  validateAttack(
    skillTotal: number,
    bonusModifiers: number,
    damageNotation: string,
    damageBonus: number,
    targetDefense: number
  ): Observable<any> {
    const body = {
      skillTotal,
      bonusModifiers,
      damageNotation,
      damageBonus,
      targetDefense
    };
    return this.http.post(`${this.apiUrl}/calculations/attack/validate`, body);
  }

  // =========================================================================
  // SYNCHRONOUS WRAPPERS (for components that need sync responses)
  // =========================================================================

  /**
   * Execute attack synchronously (returns Promise)
   */
  async executeAttackAsync(
    skillTotal: number,
    bonusModifiers: number,
    damageNotation: string,
    damageBonus: number,
    targetDefense: number,
    advantageMode: 'normal' | 'advantage' | 'disadvantage' = 'normal'
  ): Promise<any> {
    return firstValueFrom(
      this.executeAttack(skillTotal, bonusModifiers, damageNotation, damageBonus, targetDefense, advantageMode)
    );
  }

  /**
   * Execute multiple attacks synchronously
   */
  async executeAttackCombinationAsync(
    attackCount: number,
    skillTotal: number,
    bonusModifiers: number,
    damageNotation: string,
    damageBonus: number,
    targetDefense: number,
    advantageMode: 'normal' | 'advantage' | 'disadvantage' = 'normal'
  ): Promise<any> {
    return firstValueFrom(
      this.executeAttackCombination(attackCount, skillTotal, bonusModifiers, damageNotation, damageBonus, targetDefense, advantageMode)
    );
  }

  /**
   * Validate attack parameters synchronously
   */
  async validateAttackAsync(
    skillTotal: number,
    bonusModifiers: number,
    damageNotation: string,
    damageBonus: number,
    targetDefense: number
  ): Promise<any> {
    return firstValueFrom(
      this.validateAttack(skillTotal, bonusModifiers, damageNotation, damageBonus, targetDefense)
    );
  }
}
