import { TestBed } from '@angular/core/testing';
import { CharacterStateService } from '../character/characterStateService';
import { ExpertiseSourceHelper } from '../character/expertises/expertiseSource';

describe('CharacterStateService - Expertise Source Tracking', () => {
  let service: CharacterStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CharacterStateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('addExpertise', () => {
    it('should add expertise with manual source by default', () => {
      service.addExpertise('Light Weaponry');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(1);
      expect(character.selectedExpertises[0].name).toBe('Light Weaponry');
      expect(character.selectedExpertises[0].source).toBe('manual');
    });

    it('should add expertise with specified source', () => {
      service.addExpertise('Alethi', 'culture', 'culture:Alethi');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(1);
      expect(character.selectedExpertises[0].source).toBe('culture');
      expect(character.selectedExpertises[0].sourceId).toBe('culture:Alethi');
    });

    it('should not add duplicate expertise', () => {
      service.addExpertise('Light Weaponry', 'manual');
      service.addExpertise('Light Weaponry', 'manual');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(1);
    });

    it('should upgrade manual source to more specific source', () => {
      service.addExpertise('Combat Training', 'manual');
      service.addExpertise('Combat Training', 'talent', 'talent:combat_training');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(1);
      expect(character.selectedExpertises[0].source).toBe('talent');
      expect(character.selectedExpertises[0].sourceId).toBe('talent:combat_training');
    });

    it('should not downgrade non-manual source to manual', () => {
      service.addExpertise('Alethi', 'culture', 'culture:Alethi');
      service.addExpertise('Alethi', 'manual');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(1);
      expect(character.selectedExpertises[0].source).toBe('culture');
    });
  });

  describe('removeExpertise', () => {
    it('should remove manual expertise', () => {
      service.addExpertise('Light Weaponry', 'manual');
      service.removeExpertise('Light Weaponry');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(0);
    });

    it('should remove GM-granted expertise', () => {
      service.addExpertise('Custom Expertise', 'gm', 'gm:custom1');
      service.removeExpertise('Custom Expertise');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(0);
    });

    it('should NOT remove culture expertise', () => {
      service.addExpertise('Alethi', 'culture', 'culture:Alethi');
      service.removeExpertise('Alethi');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(1);
    });

    it('should NOT remove talent expertise', () => {
      service.addExpertise('Combat Training', 'talent', 'talent:combat_training');
      service.removeExpertise('Combat Training');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(1);
    });
  });

  describe('removeExpertisesBySource', () => {
    it('should remove all expertises from a specific source', () => {
      service.addExpertise('Expertise 1', 'talent', 'talent:soldier');
      service.addExpertise('Expertise 2', 'talent', 'talent:soldier');
      service.addExpertise('Expertise 3', 'talent', 'talent:archer');
      service.addExpertise('Expertise 4', 'manual');
      
      service.removeExpertisesBySource('talent:soldier');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(2);
      expect(character.selectedExpertises.some((e: any) => e.name === 'Expertise 3')).toBe(true);
      expect(character.selectedExpertises.some((e: any) => e.name === 'Expertise 4')).toBe(true);
    });

    it('should handle removing non-existent source gracefully', () => {
      service.addExpertise('Light Weaponry', 'manual');
      
      service.removeExpertisesBySource('talent:nonexistent');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(1);
    });

    it('should cascade remove when talent is removed', () => {
      // Simulate talent granting expertises
      service.addExpertise('Sleight of Hand', 'talent', 'talent:plausible_excuse');
      service.addExpertise('Light Weaponry', 'manual');
      
      // Simulate talent removal
      service.removeExpertisesBySource('talent:plausible_excuse');
      
      const character = service.getCharacter();
      expect(character.selectedExpertises.length).toBe(1);
      expect(character.selectedExpertises[0].name).toBe('Light Weaponry');
    });
  });

  describe('getSelectedExpertises', () => {
    it('should return expertise names as string array for backward compatibility', () => {
      service.addExpertise('Alethi', 'culture');
      service.addExpertise('Light Weaponry', 'manual');
      service.addExpertise('Combat Training', 'talent', 'talent:soldier');
      
      const names = service.getSelectedExpertises();
      expect(names).toEqual(['Alethi', 'Light Weaponry', 'Combat Training']);
    });
  });

  describe('getSelectedExpertisesWithSource', () => {
    it('should return full ExpertiseSource objects', () => {
      service.addExpertise('Alethi', 'culture', 'culture:Alethi');
      service.addExpertise('Light Weaponry', 'manual');
      
      const expertises = service.getSelectedExpertisesWithSource();
      expect(expertises.length).toBe(2);
      expect(expertises[0]).toEqual({
        name: 'Alethi',
        source: 'culture',
        sourceId: 'culture:Alethi'
      });
      expect(expertises[1]).toEqual({
        name: 'Light Weaponry',
        source: 'manual',
        sourceId: undefined
      });
    });
  });
});

describe('ExpertiseSourceHelper', () => {
  describe('create', () => {
    it('should create expertise source object', () => {
      const expertise = ExpertiseSourceHelper.create('Alethi', 'culture', 'culture:Alethi');
      
      expect(expertise.name).toBe('Alethi');
      expect(expertise.source).toBe('culture');
      expect(expertise.sourceId).toBe('culture:Alethi');
    });
  });

  describe('canRemove', () => {
    it('should return true for manual expertise', () => {
      const expertise = ExpertiseSourceHelper.create('Light Weaponry', 'manual');
      expect(ExpertiseSourceHelper.canRemove(expertise)).toBe(true);
    });

    it('should return true for GM-granted expertise', () => {
      const expertise = ExpertiseSourceHelper.create('Custom', 'gm');
      expect(ExpertiseSourceHelper.canRemove(expertise)).toBe(true);
    });

    it('should return false for culture expertise', () => {
      const expertise = ExpertiseSourceHelper.create('Alethi', 'culture');
      expect(ExpertiseSourceHelper.canRemove(expertise)).toBe(false);
    });

    it('should return false for talent expertise', () => {
      const expertise = ExpertiseSourceHelper.create('Combat Training', 'talent');
      expect(ExpertiseSourceHelper.canRemove(expertise)).toBe(false);
    });
  });

  describe('isAutoGranted', () => {
    it('should return true for culture expertise', () => {
      const expertise = ExpertiseSourceHelper.create('Alethi', 'culture');
      expect(ExpertiseSourceHelper.isAutoGranted(expertise)).toBe(true);
    });

    it('should return true for talent expertise', () => {
      const expertise = ExpertiseSourceHelper.create('Combat Training', 'talent');
      expect(ExpertiseSourceHelper.isAutoGranted(expertise)).toBe(true);
    });

    it('should return false for manual expertise', () => {
      const expertise = ExpertiseSourceHelper.create('Light Weaponry', 'manual');
      expect(ExpertiseSourceHelper.isAutoGranted(expertise)).toBe(false);
    });
  });

  describe('getSourceBadge', () => {
    it('should return correct badge text', () => {
      expect(ExpertiseSourceHelper.getSourceBadge('culture')).toBe('Culture');
      expect(ExpertiseSourceHelper.getSourceBadge('talent')).toBe('Talent');
      expect(ExpertiseSourceHelper.getSourceBadge('gm')).toBe('GM');
      expect(ExpertiseSourceHelper.getSourceBadge('manual')).toBe('Manual');
    });
  });

  describe('migrateFromStringArray', () => {
    it('should convert old string array to ExpertiseSource array', () => {
      const oldFormat = ['Alethi', 'Light Weaponry', 'Heavy Weaponry'];
      const migrated = ExpertiseSourceHelper.migrateFromStringArray(oldFormat);
      
      expect(migrated.length).toBe(3);
      expect(migrated[0]).toEqual({ name: 'Alethi', source: 'manual', sourceId: undefined });
      expect(migrated[1]).toEqual({ name: 'Light Weaponry', source: 'manual', sourceId: undefined });
      expect(migrated[2]).toEqual({ name: 'Heavy Weaponry', source: 'manual', sourceId: undefined });
    });

    it('should handle empty array', () => {
      const migrated = ExpertiseSourceHelper.migrateFromStringArray([]);
      expect(migrated).toEqual([]);
    });
  });

  describe('toStringArray', () => {
    it('should extract expertise names from ExpertiseSource array', () => {
      const expertises = [
        ExpertiseSourceHelper.create('Alethi', 'culture'),
        ExpertiseSourceHelper.create('Light Weaponry', 'manual'),
        ExpertiseSourceHelper.create('Combat Training', 'talent')
      ];
      
      const names = ExpertiseSourceHelper.toStringArray(expertises);
      expect(names).toEqual(['Alethi', 'Light Weaponry', 'Combat Training']);
    });

    it('should handle empty array', () => {
      const names = ExpertiseSourceHelper.toStringArray([]);
      expect(names).toEqual([]);
    });
  });
});
