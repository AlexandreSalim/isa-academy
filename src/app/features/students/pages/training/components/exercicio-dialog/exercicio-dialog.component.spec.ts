import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ExercicioDialogComponent } from './exercicio-dialog.component';

describe('ExercicioDialogComponent', () => {
  let component: ExercicioDialogComponent;
  let fixture: ComponentFixture<ExercicioDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ExercicioDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ExercicioDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
