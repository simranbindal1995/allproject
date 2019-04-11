import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherBrandProfileComponent } from './other-brand-profile.component';

describe('OtherBrandProfileComponent', () => {
  let component: OtherBrandProfileComponent;
  let fixture: ComponentFixture<OtherBrandProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OtherBrandProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherBrandProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
