import { AttributesDao } from "../../dao/attributesDao";
import { AbstractResourceManager } from "./abstractResourceManager";

export class HealthManager extends AbstractResourceManager {
    protected override calculateMaxValue(attributes: AttributesDao, bonus: number): number {
        return 10 + (attributes.strength * 5) + bonus;
    }

    takeDamage(amount: number): void {
        this.spend(amount);
    }

    heal(amount: number): void {
        this.restore(amount);
    }
}
