import { Attributes } from "../attributes/attributes";

export class DefenseManager {
    getPhysicalDefense(attribute: Attributes, bonus: number): number {
        return 10 + attribute.speed + attribute.strength + bonus;
    }
    getCognitiveDefense(attribute: Attributes, bonus: number): number {
        return 10 + attribute.intellect + attribute.willpower + bonus;
    }
    getSpiritualDefense(attribute: Attributes, bonus: number): number {
        return 10 + attribute.willpower + attribute.presence + bonus;
    }
}