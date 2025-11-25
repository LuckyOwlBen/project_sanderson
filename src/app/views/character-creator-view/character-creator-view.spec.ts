import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterCreatorView } from './character-creator-view';

describe('CharacterCreatorView', () => {
  let component: CharacterCreatorView;
  let fixture: ComponentFixture<CharacterCreatorView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterCreatorView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterCreatorView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
