import { AbstractDerivedAttributes } from "./derivedAttributesInterface";

export class LiftingAndCarryingCalculator extends AbstractDerivedAttributes {
    private liftingCapacityTable: number[] = [100, 200, 500, 1000, 5000, 10000];
    private carryingCapacityTable: number[] = [50, 100, 250, 500, 2500, 5000];

    getLiftingCapacity(strength: number): number {
        return this.getValueFromTable(this.liftingCapacityTable, strength);
    }

    getCarryingCapacity(strength: number): number {
        return this.getValueFromTable(this.carryingCapacityTable, strength);
    }
}