import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeclinedRaveComponent } from './declined-rave.component';

describe('DeclinedRaveComponent', () => {
  let component: DeclinedRaveComponent;
  let fixture: ComponentFixture<DeclinedRaveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeclinedRaveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeclinedRaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
