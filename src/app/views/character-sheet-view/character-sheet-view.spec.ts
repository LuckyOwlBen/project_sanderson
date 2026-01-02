import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { CharacterSheetView } from './character-sheet-view';

describe('CharacterSheetView', () => {
  let component: CharacterSheetView;
  let fixture: ComponentFixture<CharacterSheetView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterSheetView],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            snapshot: { params: {} }
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterSheetView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
