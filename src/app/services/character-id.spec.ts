import { TestBed } from '@angular/core/testing';

import { CharacterId } from './character-id';

describe('CharacterId', () => {
  let service: CharacterId;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CharacterId);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
