import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RookieComponent } from './rookie.component';

describe('RookieComponent', () => {
  let component: RookieComponent;
  let fixture: ComponentFixture<RookieComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RookieComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RookieComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
