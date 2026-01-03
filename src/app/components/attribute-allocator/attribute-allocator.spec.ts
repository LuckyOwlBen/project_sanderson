import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AttributeAllocator } from './attribute-allocator';
import { CharacterStateService } from '../../character/characterStateService';
import { LevelUpManager } from '../../levelup/levelUpManager';

describe('AttributeAllocator', () => {
  let component: AttributeAllocator;
  let fixture: ComponentFixture<AttributeAllocator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttributeAllocator],
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

    fixture = TestBed.createComponent(AttributeAllocator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
