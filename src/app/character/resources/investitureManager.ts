import { Attributes } from "../attributes/attributes";
import { AbstractResourceManager } from "./abstractResourceManager";

export class InvestitureManager extends AbstractResourceManager {
    private isInvestitureActive: boolean = false;
    protected override calculateMaxValue(attributes: Attributes, bonus: number): number {
        return this.isInvestitureActive ? 
            2 + Math.max(attributes.presence, attributes.awareness) + bonus
            : 0;
    }

    expendInvestiture(amount: number): boolean {
        return this.spend(amount);
    }

    regainInvestiture(amount: number): void {
        this.restore(amount);
    }

    activateInvestiture(attributes: Attributes, bonus: number): void {
        this.isInvestitureActive = true;
        this.calculateMaxValue(attributes, bonus);
    }
}