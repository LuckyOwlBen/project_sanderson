import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CultureSelector } from './culture-selector';

describe('CultureSelector', () => {
  let component: CultureSelector;
  let fixture: ComponentFixture<CultureSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CultureSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CultureSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
