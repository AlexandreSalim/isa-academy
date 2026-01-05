import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';

export interface DialogDataMuscleGroups {
  id: number;
  name: string;
}

@Component({
  selector: 'app-muscle-groups-dialog',
  templateUrl: './muscle-groups-dialog.component.html',
  styleUrls: ['./muscle-groups-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogActions, MatDialogContent, FormsModule],
})
export class MuscleGroupsDialogComponent {

  constructor(
    public dialogRef: MatDialogRef<MuscleGroupsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogDataMuscleGroups
  ) {}

  onConfirm(): void {
    this.dialogRef.close(this.data);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

}
