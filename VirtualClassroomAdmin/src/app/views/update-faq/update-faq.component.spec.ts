import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UpdateFaqComponent } from './update-faq.component';

describe('UpdateFaqComponent', () => {
  let component: UpdateFaqComponent;
  let fixture: ComponentFixture<UpdateFaqComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UpdateFaqComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UpdateFaqComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
