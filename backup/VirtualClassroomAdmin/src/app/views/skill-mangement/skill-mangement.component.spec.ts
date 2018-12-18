import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SkillMangementComponent } from './skill-mangement.component';

describe('SkillMangementComponent', () => {
  let component: SkillMangementComponent;
  let fixture: ComponentFixture<SkillMangementComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SkillMangementComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SkillMangementComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
