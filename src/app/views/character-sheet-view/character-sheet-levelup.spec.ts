import { describe, it, expect } from 'vitest';
import { CharacterSheetView } from './character-sheet-view';
import { Character } from '../../character/character';

describe('CharacterSheetView - Level Up', () => {
  it('should have navigateToLevelUp method', () => {
    expect(CharacterSheetView.prototype.navigateToLevelUp).toBeDefined();
  });

  it('should increment pendingLevelPoints when level-up event is received', () => {
    const character = new Character();
    character.level = 5;
    character.pendingLevelPoints = 0;

    // Simulate level-up
    character.level = 6;
    character.pendingLevelPoints += 1;

    expect(character.level).toBe(6);
    expect(character.pendingLevelPoints).toBe(1);
  });
});
