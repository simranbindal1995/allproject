import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageStromComponent } from './manage-strom.component';

describe('ManageStromComponent', () => {
  let component: ManageStromComponent;
  let fixture: ComponentFixture<ManageStromComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageStromComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageStromComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
