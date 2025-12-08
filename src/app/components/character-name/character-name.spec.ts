import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterName } from './character-name';

describe('CharacterName', () => {
  let component: CharacterName;
  let fixture: ComponentFixture<CharacterName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterName]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterName);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
