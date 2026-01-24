import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { PathSelector } from './path-selector';

describe('PathSelector', () => {
  let component: PathSelector;
  let fixture: ComponentFixture<PathSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathSelector],
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

    fixture = TestBed.createComponent(PathSelector);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
