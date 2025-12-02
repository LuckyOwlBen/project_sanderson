import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValueStepper } from './value-stepper';

describe('ValueStepper', () => {
  let component: ValueStepper;
  let fixture: ComponentFixture<ValueStepper>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ValueStepper]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ValueStepper);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
