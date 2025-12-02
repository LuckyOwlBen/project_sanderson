import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillSelector } from './skill-selector';

describe('SkillSelector', () => {
  let component: SkillSelector;
  let fixture: ComponentFixture<SkillSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SkillSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SkillSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
