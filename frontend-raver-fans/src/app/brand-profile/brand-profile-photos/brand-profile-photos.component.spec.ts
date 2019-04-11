import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandProfilePhotosComponent } from './brand-profile-photos.component';

describe('BrandProfilePhotosComponent', () => {
  let component: BrandProfilePhotosComponent;
  let fixture: ComponentFixture<BrandProfilePhotosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrandProfilePhotosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrandProfilePhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
