import { AbstractDerivedAttributes } from "./derivedAttributesInterface";

export class MovementRateCalculator extends AbstractDerivedAttributes {
    private movementSpeedTable: number[] = [20, 25, 30, 40, 60, 80];

    getMovementSpeed(speed: number): number {
        return this.getValueFromTable(this.movementSpeedTable, speed);
    }
}