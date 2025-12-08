import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResourceTracker } from './resource-tracker';

describe('ResourceTracker', () => {
  let component: ResourceTracker;
  let fixture: ComponentFixture<ResourceTracker>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResourceTracker]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ResourceTracker);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
