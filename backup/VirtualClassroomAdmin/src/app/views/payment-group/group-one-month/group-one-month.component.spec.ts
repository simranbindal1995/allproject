import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupOneMonthComponent } from './group-one-month.component';

describe('GroupOneMonthComponent', () => {
  let component: GroupOneMonthComponent;
  let fixture: ComponentFixture<GroupOneMonthComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupOneMonthComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupOneMonthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
