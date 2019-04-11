import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandProfileFollowersComponent } from './brand-profile-followers.component';

describe('BrandProfileFollowersComponent', () => {
  let component: BrandProfileFollowersComponent;
  let fixture: ComponentFixture<BrandProfileFollowersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrandProfileFollowersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrandProfileFollowersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
