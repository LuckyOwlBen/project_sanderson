import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TalentView } from './talent-view';

describe('TalentView', () => {
  let component: TalentView;
  let fixture: ComponentFixture<TalentView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TalentView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TalentView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
