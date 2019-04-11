import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RavelineComponent } from './raveline.component';

describe('RavelineComponent', () => {
  let component: RavelineComponent;
  let fixture: ComponentFixture<RavelineComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RavelineComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RavelineComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
