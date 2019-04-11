import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherBrandPhotosComponent } from './other-brand-photos.component';

describe('OtherBrandPhotosComponent', () => {
  let component: OtherBrandPhotosComponent;
  let fixture: ComponentFixture<OtherBrandPhotosComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OtherBrandPhotosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherBrandPhotosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
