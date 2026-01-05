import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';

export interface DialogDataExercise {
  id: number;
  name: string;
  muscle_group_id: number;
   muscle_group_name?: string;
}

@Component({
  selector: 'app-add-exercise-dialog',
  templateUrl: './add-exercise-dialog.component.html',
  styleUrls: ['./add-exercise-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogActions, MatDialogContent, FormsModule],
})
export class AddExerciseDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<AddExerciseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogDataExercise
  ) {}

  onConfirm(): void {
    this.dialogRef.close(this.data);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

}
