import { AttributesDao } from "../../dao/attributesDao";
import { DerivedAttributesDao } from "../../dao/derivedAttributesDao";
import { ResourceDao } from "../../dao/resourceDao";
export class AttributesResponse {
    strength: number;
    speed: number;
    intellect: number;
    willpower: number;
    awareness: number;
    presence: number;
    carryingCapacity: number;
    liftingCapacity: number;
    movementSpeed: number;
    recoveryDie: string;
    sensesRange: number;
    health: number;
    focus: number;
    investiture: number;
    pendingPoints: number;
    spentPoints: number;

    constructor(dao: AttributesDao, derivedAttributes: DerivedAttributesDao, resourceDao: ResourceDao ) {
        this.strength = dao.strength;
        this.speed = dao.speed;
        this.intellect = dao.intellect;
        this.willpower = dao.willpower;
        this.awareness = dao.awareness;
        this.presence = dao.presence;
        this.carryingCapacity = derivedAttributes.carryingCapacity;
        this.liftingCapacity = derivedAttributes.liftingCapacity;
        this.movementSpeed = derivedAttributes.movementSpeed;
        this.recoveryDie = derivedAttributes.recoveryDie;
        this.sensesRange = derivedAttributes.sensesRange;
        this.health = resourceDao.health;
        this.focus = resourceDao.focus;
        this.investiture = resourceDao.investiture;
        this.pendingPoints = 0;
        this.spentPoints = 0;
    }
}