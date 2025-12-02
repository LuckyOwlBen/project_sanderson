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

  readonly minValue: number = 0;
  readonly maxValue: number = 5;

  /**
   * Initialize the allocator with items and total points available
   */
  protected initialize(items: TConfig[], totalPoints: number): void {
    this.items = items;
    this.totalPoints = totalPoints;
    this.calculatePoints();
  }

  /**
   * Calculate points spent and remaining based on current allocations
   */
  protected calculatePoints(): void {
    this.pointsSpent = this.items.reduce((sum, item) => {
      return sum + (this.getCurrentValue(item) - this.minValue);
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
   * Reset all allocations to minimum value
   */
  resetAllocations(): void {
    this.items.forEach(item => {
      this.setCurrentValue(item, this.minValue);
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
