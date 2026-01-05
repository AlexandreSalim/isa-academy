import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MuscleGroupsDialogComponent } from './muscle-groups-dialog.component';

describe('MuscleGroupsDialogComponent', () => {
  let component: MuscleGroupsDialogComponent;
  let fixture: ComponentFixture<MuscleGroupsDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [MuscleGroupsDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MuscleGroupsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
