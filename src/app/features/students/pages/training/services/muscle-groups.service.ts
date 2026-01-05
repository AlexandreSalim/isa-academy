import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogDataMuscleGroups, MuscleGroupsDialogComponent } from '../components/exercicio-dialog/muscle-groups-dialog/muscle-groups-dialog.component';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MuscleGroupsService {
  constructor(private dialog: MatDialog) {}

  // Abre o dialog do exercício e retorna o afterClosed()
  openExercicioDialog(data?: Partial<DialogDataMuscleGroups>): Observable<DialogDataMuscleGroups | undefined> {
    return this.dialog
      .open(MuscleGroupsDialogComponent, {
        width: '360px',
        data: data ?? {} // dados iniciais (opcional)
      })
      .afterClosed();
  }
}
