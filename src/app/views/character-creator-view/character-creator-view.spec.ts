import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { CharacterCreatorView } from './character-creator-view';

describe('CharacterCreatorView', () => {
  let component: CharacterCreatorView;
  let fixture: ComponentFixture<CharacterCreatorView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterCreatorView],
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

    fixture = TestBed.createComponent(CharacterCreatorView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
