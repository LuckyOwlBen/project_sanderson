import { Character } from './character';

describe('Character - Level Up', () => {
  let character: Character;

  beforeEach(() => {
    character = new Character();
  });

  it('should have pendingLevelPoints property', () => {
    expect(character.pendingLevelPoints).toBeDefined();
  });

  it('should initialize pendingLevelPoints to 0', () => {
    expect(character.pendingLevelPoints).toBe(0);
  });

  it('should allow setting pendingLevelPoints', () => {
    character.pendingLevelPoints = 2;
    expect(character.pendingLevelPoints).toBe(2);
  });

  it('should track pending points when leveling up', () => {
    character.level = 1;
    character.pendingLevelPoints = 0;

    // Simulate GM granting a level
    character.level = 2;
    character.pendingLevelPoints += 1;

    expect(character.level).toBe(2);
    expect(character.pendingLevelPoints).toBe(1);
  });

  it('should decrement pending points when level-up is completed', () => {
    character.pendingLevelPoints = 3;
    
    // Simulate completing one level-up
    character.pendingLevelPoints -= 1;
    
    expect(character.pendingLevelPoints).toBe(2);
  });

  it('should track multiple pending levels', () => {
    character.level = 1;
    character.pendingLevelPoints = 0;

    // GM grants multiple levels
    character.level = 3;
    character.pendingLevelPoints = 2;

    expect(character.level).toBe(3);
    expect(character.pendingLevelPoints).toBe(2);
  });
});
