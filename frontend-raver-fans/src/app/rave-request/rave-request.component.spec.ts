import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RaveRequestComponent } from './rave-request.component';

describe('RaveRequestComponent', () => {
  let component: RaveRequestComponent;
  let fixture: ComponentFixture<RaveRequestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RaveRequestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RaveRequestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
