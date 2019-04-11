import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BrandProfilePostsComponent } from './brand-profile-posts.component';

describe('BrandProfilePostsComponent', () => {
  let component: BrandProfilePostsComponent;
  let fixture: ComponentFixture<BrandProfilePostsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BrandProfilePostsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BrandProfilePostsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
