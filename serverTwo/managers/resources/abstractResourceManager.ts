import { AttributesDao } from "../../dao/attributesDao";

export abstract class AbstractResourceManager {
    protected maxValue: number = 0;
    protected currentValue: number = 0;

    constructor() {
    }

    protected abstract calculateMaxValue(attributes: AttributesDao, bonus: number): number;

    get max(): number {
        return this.maxValue;
    }

    get current(): number {
        return this.currentValue;
    }

    spend(amount: number): boolean {
        if (this.currentValue >= amount) {
            this.currentValue = Math.max(this.currentValue - amount, 0);
            return true;
        }
        return false;
    }

    restore(amount: number): void {
        this.currentValue = Math.min(this.currentValue + amount, this.maxValue);
    }

    recalculateMax(attributes: AttributesDao, bonus: number = 0): void {
        const oldMax = this.maxValue;
        this.maxValue = this.calculateMaxValue(attributes, bonus);
        // Adjust current proportionally if max changed
        if (oldMax > 0) {
            this.currentValue = Math.min(this.currentValue, this.maxValue);
        }
    }
}