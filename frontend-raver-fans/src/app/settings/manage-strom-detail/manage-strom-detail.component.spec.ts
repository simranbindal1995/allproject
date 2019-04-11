import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ManageStromDetailComponent } from './manage-strom-detail.component';

describe('ManageStromDetailComponent', () => {
  let component: ManageStromDetailComponent;
  let fixture: ComponentFixture<ManageStromDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageStromDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ManageStromDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
