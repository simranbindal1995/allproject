import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PageMangementComponent } from './page-mangement.component';

describe('PageMangementComponent', () => {
  let component: PageMangementComponent;
  let fixture: ComponentFixture<PageMangementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PageMangementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PageMangementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
