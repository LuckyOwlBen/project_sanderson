import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { CharacterName } from './character-name';

describe('CharacterName', () => {
  let component: CharacterName;
  let fixture: ComponentFixture<CharacterName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterName],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: of({})
          }
        }
      ]
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
