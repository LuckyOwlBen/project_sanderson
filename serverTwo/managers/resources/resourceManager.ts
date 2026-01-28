import { AttributesDao } from "../../dao/attributesDao";
import { ResourceDao } from "../../dao/resourceDao";
import { FocusManager } from "./focusManager";
import { HealthManager } from "./healthManager";
import { InvestitureManager } from "./investitureManager";

export class ResourceManager {
    private healthManager: HealthManager;
    private focusManager: FocusManager;
    private investitureManager: InvestitureManager;

    constructor() {
        this.healthManager = new HealthManager();
        this.focusManager = new FocusManager();
        this.investitureManager = new InvestitureManager();
    }
    //Todo: This needs to be looped into the bonus module
    recalculateMaxValues(attributes: AttributesDao): ResourceDao {
        this.healthManager.recalculateMax(attributes, 0);
        this.focusManager.recalculateMax(attributes, 0);
        this.investitureManager.recalculateMax(attributes, 0);
        const resourceDao = new ResourceDao();
        resourceDao.health = this.healthManager.max;
        resourceDao.focus = this.focusManager.max;
        resourceDao.investiture = this.investitureManager.max;
        return resourceDao;
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
