import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterCultureView } from './character-culture-view';

describe('CharacterCultureView', () => {
  let component: CharacterCultureView;
  let fixture: ComponentFixture<CharacterCultureView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterCultureView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterCultureView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
