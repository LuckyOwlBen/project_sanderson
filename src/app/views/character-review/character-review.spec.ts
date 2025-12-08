import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterReview } from './character-review';

describe('CharacterReview', () => {
  let component: CharacterReview;
  let fixture: ComponentFixture<CharacterReview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterReview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterReview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
