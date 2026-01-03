import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SkillSelector } from './skill-selector';
import { CharacterStateService } from '../../character/characterStateService';
import { LevelUpManager } from '../../levelup/levelUpManager';

describe('SkillSelector', () => {
  let component: SkillSelector;
  let fixture: ComponentFixture<SkillSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillSelector],
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

    fixture = TestBed.createComponent(SkillSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
