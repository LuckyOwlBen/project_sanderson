import { Attributes } from "../attributes/attributes";
import { AbstractResourceManager } from "./abstractResourceManager";

export class InvestitureManager extends AbstractResourceManager {
    private isInvestitureActive: boolean = false;

    protected override calculateMaxValue(attributes: Attributes, bonus: number): number {
        return this.isInvestitureActive ? 
            2 + Math.max(attributes.presence, attributes.awareness) + bonus
            : 0;
    }

    /**
     * Check if investiture is currently active (visible on character sheet)
     */
    isActive(): boolean {
        return this.isInvestitureActive;
    }

    /**
     * Unlock investiture by speaking first ideal and taking a spren
     */
    unlock(): void {
        if (!this.isInvestitureActive) {
            this.isInvestitureActive = true;
            // Mark that we need to initialize current value on next recalculate
            this.currentValue = -1;
        }
    }

    /**
     * Recalculate max value and ensure current is properly initialized
     */
    override recalculateMax(attributes: Attributes, bonus: number = 0): void {
        const needsInitialization = this.currentValue === -1;
        super.recalculateMax(attributes, bonus);
        
        // If we just unlocked, initialize current to max
        if (needsInitialization && this.isInvestitureActive) {
            this.currentValue = this.maxValue;
        }
    }

    /**
     * Lock investiture (for resetting character progression)
     */
    lock(): void {
        this.isInvestitureActive = false;
        this.currentValue = 0;
    }

    /**
     * Spend investiture on an ability or action
     */
    expendInvestiture(amount: number): boolean {
        return this.spend(amount);
    }

    /**
     * Regain a specific amount of investiture
     */
    regainInvestiture(amount: number): void {
        this.restore(amount);
    }

    /**
     * Restore investiture to full after an encounter
     */
    restoreFully(): void {
        this.currentValue = this.maxValue;
    }

    /**
     * Activate investiture (legacy method - use unlock instead)
     * @deprecated Use unlock() instead
     */
    activateInvestiture(attributes: Attributes, bonus: number): void {
        this.unlock();
        this.recalculateMax(attributes, bonus);
    }

    /**
     * Serialize investiture state for character storage
     */
    toJSON(): any {
        return {
            isActive: this.isInvestitureActive,
            current: this.currentValue,
            max: this.maxValue
        };
    }

    /**
     * Deserialize investiture state from character storage
     */
    fromJSON(data: any): void {
        this.isInvestitureActive = data.isActive || false;
        this.currentValue = data.current || 0;
        this.maxValue = data.max || 0;
    }
}