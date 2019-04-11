import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherBrandRatingComponent } from './other-brand-rating.component';

describe('OtherBrandRatingComponent', () => {
  let component: OtherBrandRatingComponent;
  let fixture: ComponentFixture<OtherBrandRatingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OtherBrandRatingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherBrandRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
