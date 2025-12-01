import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttributeAllocator } from './attribute-allocator';

describe('AttributeAllocator', () => {
  let component: AttributeAllocator;
  let fixture: ComponentFixture<AttributeAllocator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttributeAllocator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttributeAllocator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
