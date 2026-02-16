export class Attributes {
  strength: number;
  speed: number;
  intellect: number;
  willpower: number;
  awareness: number;
  presence: number;
  totalPoints: number = 0;
  pointsSpent: number = 0;
  pointsRemaining: number = 0;
  finalized: boolean = false;

  constructor() {
    this.strength = 0;
    this.speed = 0;
    this.intellect = 0;
    this.willpower = 0;
    this.awareness = 0;
    this.presence = 0;
    this.totalPoints = 0;
    this.pointsSpent = 0;
    this.pointsRemaining = 0;
    this.finalized = false;
  }

  // Generic methods for dynamic access
  addToAttribute(attribute: keyof Attributes): void {
    this[attribute]++;
  }

  setAttribute(attribute: keyof Attributes, value: number): void {
    (this[attribute] as number) = value;
  }

  getAttribute(attribute: keyof Attributes): number {
    return this[attribute] as number;
  }
}
