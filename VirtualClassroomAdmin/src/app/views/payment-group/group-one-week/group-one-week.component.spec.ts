import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GroupOneWeekComponent } from './group-one-week.component';

describe('GroupOneWeekComponent', () => {
  let component: GroupOneWeekComponent;
  let fixture: ComponentFixture<GroupOneWeekComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupOneWeekComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupOneWeekComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
