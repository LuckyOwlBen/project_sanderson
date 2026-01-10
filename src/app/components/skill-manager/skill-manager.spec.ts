import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SkillManager } from './skill-manager';
import { CharacterStateService } from '../../character/characterStateService';
import { LevelUpManager } from '../../levelup/levelUpManager';
import { Character } from '../../character/character';
import { SkillType } from '../../character/skills/skillTypes';

describe('SkillManager', () => {
  let component: SkillManager;
  let fixture: ComponentFixture<SkillManager>;
  let characterStateService: CharacterStateService;
  let mockCharacter: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillManager],
      providers: [
        CharacterStateService,
        LevelUpManager,
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillManager);
    component = fixture.componentInstance;
    characterStateService = TestBed.inject(CharacterStateService);
    
    // Create a fresh character for each test
    mockCharacter = new Character();
    // Don't update character state service yet - let individual tests do it
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Surge Skills', () => {
    beforeEach(() => {
      // Recreate fixture for each surge skill test to ensure clean state
      fixture = TestBed.createComponent(SkillManager);
      component = fixture.componentInstance;
    });

    it('should not include surge skills when First Ideal has not been spoken', () => {
      // Character has no radiant path setup
      characterStateService.updateCharacter(mockCharacter);
      fixture.detectChanges();

      expect(component.surgeSkills.length).toBe(0);
      expect(component.physicalSkills.length).toBe(6);
      expect(component.mentalSkills.length).toBe(6);
      expect(component.socialSkills.length).toBe(6);
    });

    it('should not include surge skills when spren is granted but First Ideal not spoken', () => {
      mockCharacter.radiantPath.grantSpren('Windrunner');
      characterStateService.updateCharacter(mockCharacter);
      fixture.detectChanges();

      expect(component.surgeSkills.length).toBe(0);
      expect(mockCharacter.radiantPath.hasSpren()).toBe(true);
      expect(mockCharacter.radiantPath.hasSpokenIdeal()).toBe(false);
    });

    it('should include surge skills after First Ideal is spoken', () => {
      // Grant spren and speak ideal
      mockCharacter.radiantPath.grantSpren('Windrunner');
      mockCharacter.radiantPath.speakIdeal(mockCharacter.skills);
      
      characterStateService.updateCharacter(mockCharacter);
      fixture.detectChanges();

      expect(component.surgeSkills.length).toBe(2);
      expect(mockCharacter.radiantPath.hasSpokenIdeal()).toBe(true);
      
      // Windrunner should have Adhesion and Gravitation
      const surgeTypes = component.surgeSkills.map(s => s.type);
      expect(surgeTypes).toContain(SkillType.ADHESION);
      expect(surgeTypes).toContain(SkillType.GRAVITATION);
    });

    it('should include correct surge skills for different Radiant Orders', () => {
      // Test Skybreaker (Division and Gravitation)
      const testChar = new Character();
      testChar.radiantPath.grantSpren('Skybreaker');
      testChar.radiantPath.speakIdeal(testChar.skills);
      
      characterStateService.updateCharacter(testChar);
      fixture.detectChanges();

      expect(component.surgeSkills.length).toBe(2);
      const surgeTypes = component.surgeSkills.map(s => s.type);
      expect(surgeTypes).toContain(SkillType.DIVISION);
      expect(surgeTypes).toContain(SkillType.GRAVITATION);
    });

    it('should show surge skills are associated with Willpower', () => {
      const testChar = new Character();
      testChar.radiantPath.grantSpren('Windrunner');
      testChar.radiantPath.speakIdeal(testChar.skills);
      
      characterStateService.updateCharacter(testChar);
      fixture.detectChanges();

      expect(component.surgeSkills.length).toBe(2);
      component.surgeSkills.forEach(skill => {
        expect(skill.associatedAttribute).toBe('Willpower');
      });
    });

    it('should initialize surge skills with rank 0 after speaking First Ideal', () => {
      const testChar = new Character();
      testChar.radiantPath.grantSpren('Lightweaver');
      testChar.radiantPath.speakIdeal(testChar.skills);
      
      characterStateService.updateCharacter(testChar);
      fixture.detectChanges();

      expect(component.surgeSkills.length).toBe(2);
      
      // Lightweaver should have Illumination and Transformation
      const surgeTypes = component.surgeSkills.map(s => s.type);
      expect(surgeTypes).toContain(SkillType.ILLUMINATION);
      expect(surgeTypes).toContain(SkillType.TRANSFORMATION);
      
      // Both should start at rank 0
      component.surgeSkills.forEach(skill => {
        expect(skill.currentValue).toBe(0);
      });
    });

    it('should allow ranking up surge skills like regular skills', () => {
      const testChar = new Character();
      testChar.radiantPath.grantSpren('Edgedancer');
      testChar.radiantPath.speakIdeal(testChar.skills);
      
      characterStateService.updateCharacter(testChar);
      fixture.detectChanges();

      expect(component.surgeSkills.length).toBe(2);
      
      // Find Abrasion skill
      const abrasionSkill = component.surgeSkills.find(s => s.type === SkillType.ABRASION);
      expect(abrasionSkill).toBeTruthy();
      
      if (abrasionSkill) {
        // Use the public getCurrentValue and setCurrentValue through the component
        const initialValue = component['getCurrentValue'](abrasionSkill);
        component['setCurrentValue'](abrasionSkill, 2);
        expect(abrasionSkill.currentValue).toBe(2);
        expect(testChar.skills.getSkillRank(SkillType.ABRASION)).toBe(2);
      }
    });

    it('should calculate total value for surge skills including Willpower attribute', () => {
      const testChar = new Character();
      // Set Willpower attribute
      testChar.attributes.setAttribute('willpower', 3);
      
      testChar.radiantPath.grantSpren('Stoneward');
      testChar.radiantPath.speakIdeal(testChar.skills);
      testChar.skills.setSkillRank(SkillType.COHESION, 2);
      
      characterStateService.updateCharacter(testChar);
      fixture.detectChanges();

      const cohesionSkill = component.surgeSkills.find(s => s.type === SkillType.COHESION);
      expect(cohesionSkill).toBeTruthy();
      
      if (cohesionSkill) {
        // Total should be skill rank (2) + willpower (3) = 5
        expect(cohesionSkill.total).toBe(5);
      }
    });
  });
});
