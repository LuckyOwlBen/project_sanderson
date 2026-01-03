/**
 * Base class for components that manage point allocation systems.
 * Provides common functionality for tracking points, managing allocations,
 * and enforcing constraints.
 */
export abstract class BaseAllocator<TConfig> {
  items: TConfig[] = [];
  totalPoints: number = 0;
  pointsSpent: number = 0;
  remainingPoints: number = 0;
  baselineValues: Map<string, number> = new Map();

  readonly minValue: number = 0;
  readonly maxValue: number = 5;

  /**
   * Get the minimum value for a specific item (baseline in level-up mode, 0 otherwise)
   */
  getMinValue(item: TConfig): number {
    return this.baselineValues.get(this.getLabel(item)) ?? this.minValue;
  }

  /**
   * Initialize the allocator with items and total points available
   * @param useCurrentAsBaseline - In level-up mode, treat current values as baseline (don't count them as spent)
   */
  protected initialize(items: TConfig[], totalPoints: number, useCurrentAsBaseline: boolean = false): void {
    this.items = items;
    this.totalPoints = totalPoints;
    
    // In level-up mode, store current values as baseline
    if (useCurrentAsBaseline) {
      this.baselineValues.clear();
      items.forEach(item => {
        this.baselineValues.set(this.getLabel(item), this.getCurrentValue(item));
      });
    } else {
      this.baselineValues.clear();
    }
    
    this.calculatePoints();
  }

  /**
   * Calculate points spent and remaining based on current allocations
   */
  protected calculatePoints(): void {
    this.pointsSpent = this.items.reduce((sum, item) => {
      const currentValue = this.getCurrentValue(item);
      const baseline = this.baselineValues.get(this.getLabel(item)) ?? this.minValue;
      return sum + (currentValue - baseline);
    }, 0);

    this.remainingPoints = this.totalPoints - this.pointsSpent;
  }

  /**
   * Handle value change for an item
   */
  onValueChanged(event: {label: string, value: number}): void {
    const item = this.items.find(i => this.getLabel(i) === event.label);
    
    if (item) {
      const oldValue = this.getCurrentValue(item);
      const newValue = event.value;
      const pointDifference = newValue - oldValue;

      // Update the item value
      this.setCurrentValue(item, newValue);

      // Update points tracking
      this.pointsSpent += pointDifference;
      this.remainingPoints -= pointDifference;

      // Hook for custom behavior
      this.onItemChanged(item, newValue);
    }
  }

  /**
   * Reset all allocations to minimum value (or baseline in level-up mode)
   */
  resetAllocations(): void {
    this.items.forEach(item => {
      const resetValue = this.getMinValue(item);
      this.setCurrentValue(item, resetValue);
    });

    this.pointsSpent = 0;
    this.remainingPoints = this.totalPoints;
    this.onResetComplete();
  }

  /**
   * Check if all points have been allocated
   */
  get isComplete(): boolean {
    return this.remainingPoints === 0;
  }

  /**
   * Check if user can proceed (all points allocated)
   */
  get canProceed(): boolean {
    return this.isComplete;
  }

  // Abstract methods that must be implemented by subclasses
  protected abstract getLabel(item: TConfig): string;
  protected abstract getCurrentValue(item: TConfig): number;
  protected abstract setCurrentValue(item: TConfig, value: number): void;
  protected abstract onItemChanged(item: TConfig, newValue: number): void;
  protected abstract onResetComplete(): void;
}
