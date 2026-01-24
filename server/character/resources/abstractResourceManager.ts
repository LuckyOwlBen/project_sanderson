import { Attributes } from "../attributes/attributes";

export abstract class AbstractResourceManager {
    protected maxValue: number;
    protected currentValue: number;

    constructor(attributes: Attributes, bonus: number) {
        this.maxValue = this.calculateMaxValue(attributes, bonus);
        this.currentValue = this.maxValue;
    }

    protected abstract calculateMaxValue(attributes: Attributes, bonus: number): number;

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

    recalculateMax(attributes: Attributes, bonus: number = 0): void {
        const oldMax = this.maxValue;
        this.maxValue = this.calculateMaxValue(attributes, bonus);
        // Adjust current proportionally if max changed
        if (oldMax > 0) {
            this.currentValue = Math.min(this.currentValue, this.maxValue);
        }
    }
}