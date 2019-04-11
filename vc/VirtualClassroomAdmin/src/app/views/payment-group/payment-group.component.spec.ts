import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentGroupComponent } from './payment-group.component';

describe('PaymentGroupComponent', () => {
  let component: PaymentGroupComponent;
  let fixture: ComponentFixture<PaymentGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
