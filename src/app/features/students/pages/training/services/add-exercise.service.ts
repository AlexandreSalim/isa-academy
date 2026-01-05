import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {  MuscleGroupsDialogComponent } from '../components/exercicio-dialog/muscle-groups-dialog/muscle-groups-dialog.component';
import { Observable } from 'rxjs';
import { AddExerciseDialogComponent, DialogDataExercise } from '../components/exercicio-dialog/add-exercise-dialog/add-exercise-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class AddExerciseService {
  constructor(private dialog: MatDialog) {}

  // Abre o dialog do exercício e retorna o afterClosed()
  openAddExercicioDialog(data?: Partial<DialogDataExercise>): Observable<DialogDataExercise | undefined> {
    return this.dialog
      .open(AddExerciseDialogComponent, {
        width: '360px',
        data: data ?? {} // dados iniciais (opcional)
      })
      .afterClosed();
  }
}
