import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PetDisplayComponent } from './pet-display.component';
import { Character } from '../../../character/character';
import { getPetById } from '../../../character/inventory/petDefinitions';

describe('PetDisplayComponent', () => {
  let component: PetDisplayComponent;
  let fixture: ComponentFixture<PetDisplayComponent>;
  let character: Character;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PetDisplayComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PetDisplayComponent);
    component = fixture.componentInstance;
    character = new Character();
    character.name = 'Test Character';
    component.character = character;
  });

  describe('Pet Display Rendering', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should render pet card when pet is provided', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      const petCard = fixture.nativeElement.querySelector('.pet-card');
      expect(petCard).toBeTruthy();
    });

    it('should display pet name', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      const petName = fixture.nativeElement.querySelector('.pet-name');
      expect(petName.textContent).toContain('Chickenhawk');
    });

    it('should display pet species', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      const petType = fixture.nativeElement.querySelector('.pet-type');
      expect(petType.textContent).toContain('Chickenhawk');
    });

    it('should display pet description', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      const description = fixture.nativeElement.querySelector('.pet-description');
      expect(description.textContent).toContain('fierce avian');
    });
  });

  describe('Pet Status Display', () => {
    it('should show "Available" status when pet is not equipped', () => {
      const chickenhawk = getPetById('chickenhawk');
      character.inventory.addItem('chickenhawk', 1);
      component.pet = chickenhawk || null;
      component.character = character;
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.status-badge.available');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('Available');
    });

    it('should show "Bonded" status when pet is equipped', () => {
      const chickenhawk = getPetById('chickenhawk');
      character.inventory.addItem('chickenhawk', 1);
      character.inventory.equipItem('chickenhawk');
      component.pet = character.inventory.getEquippedItem('accessory') || null;
      component.character = character;
      fixture.detectChanges();

      const badge = fixture.nativeElement.querySelector('.status-badge.equipped');
      expect(badge).toBeTruthy();
      expect(badge.textContent).toContain('Bonded');
    });
  });

  describe('Pet Properties Display', () => {
    it('should display intelligence level', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      expect(component.getIntelligenceLabel()).toContain('Animal');
    });

    it('should display sapient intelligence correctly', () => {
      const drake = getPetById('storm-drake');
      component.pet = drake || null;
      fixture.detectChanges();

      expect(component.getIntelligenceLabel()).toBe('Sapient');
    });

    it('should display movement speed', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;

      const movement = component.getMovementInfo();
      expect(movement).toContain('Flying');
      expect(movement).toContain('40');
    });

    it('should display special abilities', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      const abilitiesSection = fixture.nativeElement.querySelector('.abilities-list');
      expect(abilitiesSection).toBeTruthy();
      
      const abilities = fixture.nativeElement.querySelectorAll('.ability');
      expect(abilities.length).toBeGreaterThan(0);
    });

    it('should display pet weight', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      const petStats = fixture.nativeElement.querySelector('.pet-stats');
      expect(petStats.textContent).toContain('lbs');
    });
  });

  describe('Pet Actions', () => {
    it('should show Bond button when pet is not equipped', () => {
      const chickenhawk = getPetById('chickenhawk');
      character.inventory.addItem('chickenhawk', 1);
      component.pet = chickenhawk || null;
      component.character = character;
      fixture.detectChanges();

      const bondButton = fixture.nativeElement.querySelector('.bond-button');
      expect(bondButton).toBeTruthy();
      expect(bondButton.textContent).toContain('Bond');
    });

    it('should show Release button when pet is equipped', () => {
      const chickenhawk = getPetById('chickenhawk');
      character.inventory.addItem('chickenhawk', 1);
      character.inventory.equipItem('chickenhawk');
      component.pet = character.inventory.getEquippedItem('accessory') || null;
      component.character = character;
      fixture.detectChanges();

      const releaseButton = fixture.nativeElement.querySelector('.unbond-button');
      expect(releaseButton).toBeTruthy();
      expect(releaseButton.textContent).toContain('Release');
    });

    it('should equip pet when Bond button is clicked', () => {
      const chickenhawk = getPetById('chickenhawk');
      character.inventory.addItem('chickenhawk', 1);
      component.pet = chickenhawk || null;
      component.character = character;
      fixture.detectChanges();

      const bondButton = fixture.nativeElement.querySelector('.bond-button');
      bondButton.click();

      expect(component.isEquipped()).toBe(true);
    });

    it('should unequip pet when Release button is clicked', () => {
      const chickenhawk = getPetById('chickenhawk');
      character.inventory.addItem('chickenhawk', 1);
      character.inventory.equipItem('chickenhawk');
      component.pet = character.inventory.getEquippedItem('accessory') || null;
      component.character = character;
      fixture.detectChanges();

      const releaseButton = fixture.nativeElement.querySelector('.unbond-button');
      releaseButton.click();

      expect(component.isEquipped()).toBe(false);
    });

    it('should always show Remove button', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      const removeButton = fixture.nativeElement.querySelector('.remove-button');
      expect(removeButton).toBeTruthy();
      expect(removeButton.textContent).toContain('Remove');
    });

    it('should remove pet from inventory when Remove button is clicked', () => {
      const chickenhawk = getPetById('chickenhawk');
      character.inventory.addItem('chickenhawk', 1);
      component.pet = chickenhawk || null;
      component.character = character;

      expect(character.inventory.getItemQuantity('chickenhawk')).toBe(1);

      component.removePet();

      expect(character.inventory.getItemQuantity('chickenhawk')).toBe(0);
    });
  });

  describe('Dark Mode Styling', () => {
    it('should apply dark mode classes to pet card', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      const petCard = fixture.nativeElement.querySelector('.pet-card');
      expect(petCard.classList.contains('pet-card')).toBe(true);
    });

    it('should have proper button styling classes', () => {
      const chickenhawk = getPetById('chickenhawk');
      component.pet = chickenhawk || null;
      fixture.detectChanges();

      const bondButton = fixture.nativeElement.querySelector('.bond-button');
      expect(bondButton.classList.contains('bond-button')).toBe(true);
      expect(bondButton.classList.contains('action-button')).toBe(true);
    });
  });
});
