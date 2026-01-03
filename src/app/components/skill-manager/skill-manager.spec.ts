import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { SkillManager } from './skill-manager';
import { CharacterStateService } from '../../character/characterStateService';
import { LevelUpManager } from '../../levelup/levelUpManager';

describe('SkillManager', () => {
  let component: SkillManager;
  let fixture: ComponentFixture<SkillManager>;

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
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
