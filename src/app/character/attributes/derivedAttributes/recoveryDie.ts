import { AbstractDerivedAttributes } from "./derivedAttributesInterface";

export class RecoveryDieCalculator extends AbstractDerivedAttributes {
    private recoveryDieTable: string[] = ['1d4', '1d6', '1d8', '1d10', '1d12', '1d20'];

    getRecoveryDie(willpower: number): string {
        return this.getValueFromTable(this.recoveryDieTable, willpower);
    }
}