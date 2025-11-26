import { TestBed } from '@angular/core/testing';

import { CharacterCreationFlowService } from './character-creation-flow-service';

describe('CharacterCreationFlowService', () => {
  let service: CharacterCreationFlowService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CharacterCreationFlowService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
