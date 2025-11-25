import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AncestrySelector } from './ancestry-selector';

describe('AncestrySelector', () => {
  let component: AncestrySelector;
  let fixture: ComponentFixture<AncestrySelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AncestrySelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AncestrySelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
