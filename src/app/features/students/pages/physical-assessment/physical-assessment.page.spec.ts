import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PhysicalAssessmentPage } from './physical-assessment.page';

describe('PhysicalAssessmentPage', () => {
  let component: PhysicalAssessmentPage;
  let fixture: ComponentFixture<PhysicalAssessmentPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PhysicalAssessmentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
