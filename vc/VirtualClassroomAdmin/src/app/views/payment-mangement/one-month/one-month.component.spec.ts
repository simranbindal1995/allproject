import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OneMonthComponent } from './one-month.component';

describe('OneMonthComponent', () => {
  let component: OneMonthComponent;
  let fixture: ComponentFixture<OneMonthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OneMonthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OneMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
