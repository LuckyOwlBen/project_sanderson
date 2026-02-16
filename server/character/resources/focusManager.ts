import { Attributes } from "../attributes/attributes";
import { AbstractResourceManager } from "./abstractResourceManager";

export class FocusManager extends AbstractResourceManager {
    protected override calculateMaxValue(attributes: Attributes, bonus: number): number {
        return 2 + attributes.willpower + bonus; 
    }

    loseFocus(amount: number): boolean {
        return this.spend(amount);
    }

    regainFocus(amount: number): void {
        this.restore(amount);
    }
}
