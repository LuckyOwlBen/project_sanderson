import { SensesRangeCalculator } from './sensesRange';
import { LiftingAndCarryingCalculator } from './liftingAndCarrying';
import { MovementRateCalculator } from './movementRate';
import { RecoveryDieCalculator } from './recoveryDie';
import { AttributesDao } from '../../dao/attributesDao';
import { DerivedAttributesDao } from '../../dao/derivedAttributesDao';

export class DerivedAttributesManager {

    private sensesRangeCalculator = new SensesRangeCalculator();
    private liftingAndCarryingCalculator = new LiftingAndCarryingCalculator();
    private movementRateCalculator = new MovementRateCalculator();
    private recoveryDieCalculator = new RecoveryDieCalculator();
  
  getDerivedAttributes(attribute: AttributesDao): DerivedAttributesDao {
    const derivedAttributes = new DerivedAttributesDao();
    derivedAttributes.carryingCapacity = this.getCarryingCapacity(attribute);
    derivedAttributes.liftingCapacity = this.getLiftingCapacity(attribute);
    derivedAttributes.movementSpeed = this.getMovementSpeed(attribute);
    derivedAttributes.recoveryDie = this.getRecoveryDie(attribute);
    derivedAttributes.sensesRange = this.getSensesRange(attribute);
    return derivedAttributes;
  }
      
  getLiftingCapacity(attribute: AttributesDao): number {
    return this.liftingAndCarryingCalculator.getLiftingCapacity(attribute.strength);
  }
  
  getCarryingCapacity(attribute: AttributesDao): number {
    return this.liftingAndCarryingCalculator.getCarryingCapacity(attribute.strength);
  }

  getMovementSpeed(attribute: AttributesDao): number {
    return this.movementRateCalculator.getMovementSpeed(attribute.speed);
  }

  getRecoveryDie(attribute: AttributesDao): string {
    return this.recoveryDieCalculator.getRecoveryDie(attribute.willpower);
  }

  getSensesRange(attribute: AttributesDao): number {
    return this.sensesRangeCalculator.getSensesRange(attribute.awareness);
  }
}