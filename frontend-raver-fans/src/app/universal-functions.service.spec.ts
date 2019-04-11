import { TestBed, inject } from '@angular/core/testing';

import { UniversalFunctionsService } from './universal-functions.service';

describe('UniversalFunctionsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UniversalFunctionsService]
    });
  });

  it('should be created', inject([UniversalFunctionsService], (service: UniversalFunctionsService) => {
    expect(service).toBeTruthy();
  }));
});
