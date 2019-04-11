import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FanHomeComponent } from './fan-home.component';

describe('FanHomeComponent', () => {
  let component: FanHomeComponent;
  let fixture: ComponentFixture<FanHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FanHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FanHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
