import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DisputeMangementComponent } from './dispute-mangement.component';

describe('DisputeMangementComponent', () => {
  let component: DisputeMangementComponent;
  let fixture: ComponentFixture<DisputeMangementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DisputeMangementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DisputeMangementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
