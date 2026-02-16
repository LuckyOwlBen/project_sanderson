export class AdvantageModule {
  private advantageSources: Set<string> = new Set();
  private disadvantageSources: Set<string> = new Set();

  addAdvantage(source: string): void {
    this.advantageSources.add(source);
  }

  addDisadvantage(source: string): void {
    this.disadvantageSources.add(source);
  }

  removeAdvantage(source: string): void {
    this.advantageSources.delete(source);
  }

  removeDisadvantage(source: string): void {
    this.disadvantageSources.delete(source);
  }

  hasAdvantage(): boolean {
    // Advantage and disadvantage cancel out
    if (this.advantageSources.size > 0 && this.disadvantageSources.size > 0) {
      return false;
    }
    return this.advantageSources.size > 0;
  }

  hasDisadvantage(): boolean {
    // Advantage and disadvantage cancel out
    if (this.advantageSources.size > 0 && this.disadvantageSources.size > 0) {
      return false;
    }
    return this.disadvantageSources.size > 0;
  }

  clear(): void {
    this.advantageSources.clear();
    this.disadvantageSources.clear();
  }
}