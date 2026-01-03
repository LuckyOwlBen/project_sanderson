import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTabsModule } from '@angular/material/tabs';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { Character } from '../../character/character';
import { Recipe, CraftingResult, MaterialRequirement } from '../../character/crafting/craftingManager';
import { CharacterStateService } from '../../character/characterStateService';

@Component({
  selector: 'app-crafting-view',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatExpansionModule,
    MatTabsModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: './crafting-view.html',
  styleUrls: ['./crafting-view.scss']
})
export class CraftingView implements OnInit, OnDestroy {
  @Input() character: Character | null = null;

  private destroy$ = new Subject<void>();
  
  availableRecipes: Recipe[] = [];
  allRecipes: Recipe[] = [];
  selectedCategory: Recipe['category'] | 'all' = 'all';
  lastCraftResult: CraftingResult | null = null;

  constructor(private characterState: CharacterStateService) {}

  ngOnInit(): void {
    this.characterState.character$
      .pipe(takeUntil(this.destroy$))
      .subscribe(character => {
        if (character) {
          this.character = character;
          this.refreshRecipes();
        }
      });

    if (this.character) {
      this.refreshRecipes();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  refreshRecipes(): void {
    if (!this.character) return;
    
    this.availableRecipes = this.character.crafting.getAvailableRecipes();
    this.allRecipes = this.character.crafting.getAllRecipes();
  }

  getFilteredRecipes(): Recipe[] {
    if (this.selectedCategory === 'all') {
      return this.availableRecipes;
    }
    return this.availableRecipes.filter(r => r.category === this.selectedCategory);
  }

  selectCategory(category: Recipe['category'] | 'all'): void {
    this.selectedCategory = category;
  }

  canCraftRecipe(recipeId: string): boolean {
    if (!this.character) return false;
    const result = this.character.crafting.canCraft(recipeId);
    return result.canCraft;
  }

  getCraftabilityMessage(recipeId: string): string {
    if (!this.character) return 'No character loaded';
    const result = this.character.crafting.canCraft(recipeId);
    return result.canCraft ? 'Ready to craft' : (result.reason || 'Cannot craft');
  }

  craftItem(recipe: Recipe): void {
    if (!this.character) return;
    
    const result = this.character.crafting.craftItem(recipe.id);
    this.lastCraftResult = result;
    
    if (result.success) {
      this.characterState.updateCharacter(this.character);
      this.refreshRecipes();
    }

    // Auto-dismiss success message after 5 seconds
    if (result.success) {
      setTimeout(() => {
        if (this.lastCraftResult === result) {
          this.lastCraftResult = null;
        }
      }, 5000);
    }
  }

  dismissResult(): void {
    this.lastCraftResult = null;
  }

  getMaterialStatus(recipe: Recipe): { available: number; required: number; itemId: string }[] {
    if (!this.character) return [];
    
    return recipe.materials.map(mat => ({
      itemId: mat.itemId,
      required: mat.quantity,
      available: this.character!.inventory.getItemQuantity(mat.itemId)
    }));
  }

  hasMaterial(material: MaterialRequirement): boolean {
    if (!this.character) return false;
    const available = this.character.inventory.getItemQuantity(material.itemId);
    return available >= material.quantity;
  }

  getDifficultyColor(difficulty: Recipe['difficulty']): string {
    const colorMap = {
      'trivial': 'primary',
      'easy': 'primary',
      'moderate': 'accent',
      'hard': 'warn',
      'very-hard': 'warn',
      'masterwork': 'warn'
    };
    return colorMap[difficulty];
  }

  getCategoryIcon(category: Recipe['category']): string {
    const iconMap = {
      'weapon': 'swords',
      'armor': 'shield',
      'utility': 'construction',
      'consumable': 'science',
      'fabrial': 'auto_awesome',
      'equipment': 'handyman'
    };
    return iconMap[category];
  }

  getCategoryCount(category: Recipe['category']): number {
    return this.availableRecipes.filter(r => r.category === category).length;
  }

  formatItemName(itemId: string): string {
    return itemId
      .split(/[-_]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  formatDifficulty(difficulty: Recipe['difficulty']): string {
    return difficulty
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  getItemQuantity(itemId: string): number {
    return this.character?.inventory.getItemQuantity(itemId) || 0;
  }
}
