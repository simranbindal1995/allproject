import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FanHowItWorksComponent } from './fan-how-it-works.component';

describe('FanHowItWorksComponent', () => {
  let component: FanHowItWorksComponent;
  let fixture: ComponentFixture<FanHowItWorksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FanHowItWorksComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FanHowItWorksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
