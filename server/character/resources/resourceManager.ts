import { Attributes } from "../attributes/attributes";
import { FocusManager } from "./focusManager";
import { HealthManager } from "./healthManager";
import { InvestitureManager } from "./investitureManager";

export class ResourceManager {
    private healthManager: HealthManager;
    private focusManager: FocusManager;
    private investitureManager: InvestitureManager;

    constructor(attributes: Attributes) {
        this.healthManager = new HealthManager(attributes, 0);
        this.focusManager = new FocusManager(attributes, 0);
        this.investitureManager = new InvestitureManager(attributes, 0);
    }

    recalculateMaxValues(attributes: Attributes): void {
        this.healthManager.recalculateMax(attributes, 0);
        this.focusManager.recalculateMax(attributes, 0);
        this.investitureManager.recalculateMax(attributes, 0);
    }

    get health() {
        return this.healthManager;
    }

    get focus() {
        return this.focusManager;
    }

    get investiture() {
        return this.investitureManager;
    }
}
