import { AbstractDerivedAttributes } from "./derivedAttributesInterface";

export class SensesRangeCalculator extends AbstractDerivedAttributes {
    private sensesRangeTable: number[] = [5, 10, 20, 50, 100, Infinity];

    getSensesRange(perception: number): number {
        return this.getValueFromTable(this.sensesRangeTable, perception);
    }
}