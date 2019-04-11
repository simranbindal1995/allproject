import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandProfileRatingComponent } from './brand-profile-rating.component';

describe('BrandProfileRatingComponent', () => {
  let component: BrandProfileRatingComponent;
  let fixture: ComponentFixture<BrandProfileRatingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrandProfileRatingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrandProfileRatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
