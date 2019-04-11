import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PreviousPaymentsComponent } from './previous-payments.component';

describe('PreviousPaymentsComponent', () => {
  let component: PreviousPaymentsComponent;
  let fixture: ComponentFixture<PreviousPaymentsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviousPaymentsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviousPaymentsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
