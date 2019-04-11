import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OtherBrandNetworkComponent } from './other-brand-network.component';

describe('OtherBrandNetworkComponent', () => {
  let component: OtherBrandNetworkComponent;
  let fixture: ComponentFixture<OtherBrandNetworkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OtherBrandNetworkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtherBrandNetworkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
