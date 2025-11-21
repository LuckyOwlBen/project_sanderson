import { Attributes } from '../attributes';
import { SensesRangeCalculator } from './sensesRange';
import { LiftingAndCarryingCalculator } from './liftingAndCarrying';
import { MovementRateCalculator } from './movementRate';
import { RecoveryDieCalculator } from './recoveryDie';

export class DerivedAttributesManager {

    private sensesRangeCalculator = new SensesRangeCalculator();
    private liftingAndCarryingCalculator = new LiftingAndCarryingCalculator();
    private movementRateCalculator = new MovementRateCalculator();
    private recoveryDieCalculator = new RecoveryDieCalculator();
      
  getLiftingCapacity(attribute: Attributes): number {
    return this.liftingAndCarryingCalculator.getLiftingCapacity(attribute.strength);
  }
  
  getCarryingCapacity(attribute: Attributes): number {
    return this.liftingAndCarryingCalculator.getCarryingCapacity(attribute.strength);
  }

  getMovementSpeed(attribute: Attributes): number {
    return this.movementRateCalculator.getMovementSpeed(attribute.speed);
  }

  getRecoveryDie(attribute: Attributes): string {
    return this.recoveryDieCalculator.getRecoveryDie(attribute.willpower);
  }

  getSensesRange(attribute: Attributes): number {
    return this.sensesRangeCalculator.getSensesRange(attribute.awareness);
  }
}