import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LandingView } from './landing-view';

describe('LandingView', () => {
  let component: LandingView;
  let fixture: ComponentFixture<LandingView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LandingView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LandingView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
