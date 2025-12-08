import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterSheetView } from './character-sheet-view';

describe('CharacterSheetView', () => {
  let component: CharacterSheetView;
  let fixture: ComponentFixture<CharacterSheetView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterSheetView]
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
