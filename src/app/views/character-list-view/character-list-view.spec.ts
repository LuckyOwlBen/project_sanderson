import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CharacterListView } from './character-list-view';

describe('CharacterListView', () => {
  let component: CharacterListView;
  let fixture: ComponentFixture<CharacterListView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CharacterListView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CharacterListView);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
