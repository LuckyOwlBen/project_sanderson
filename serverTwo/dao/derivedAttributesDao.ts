export class DerivedAttributesDao {
    carryingCapacity: number;
    liftingCapacity: number;
    movementSpeed: number;
    recoveryDie: string;
    sensesRange: number;

    constructor() {
        this.carryingCapacity = 0;
        this.liftingCapacity = 0;
        this.movementSpeed = 0;
        this.recoveryDie = "";
        this.sensesRange = 0;
    }
}