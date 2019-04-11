import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FollowerProfileComponent } from './follower-profile.component';

describe('FollowerProfileComponent', () => {
  let component: FollowerProfileComponent;
  let fixture: ComponentFixture<FollowerProfileComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FollowerProfileComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FollowerProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
