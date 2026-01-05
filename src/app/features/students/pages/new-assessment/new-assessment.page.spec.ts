import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NewAssessmentPage } from './new-assessment.page';

describe('NewAssessmentPage', () => {
  let component: NewAssessmentPage;
  let fixture: ComponentFixture<NewAssessmentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(NewAssessmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
