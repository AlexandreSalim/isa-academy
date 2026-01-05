// src/app/features/training/services/add-exercicio.service.ts
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { DialogData, ExercicioDialogComponent } from '../components/exercicio-dialog/exercicio-dialog.component';


@Injectable({
  providedIn: 'root'
})
export class AddExercicioService {
  constructor(private dialog: MatDialog) {}

  // Abre o dialog do exercício e retorna o afterClosed()
  openExercicioDialog(data?: Partial<DialogData>, isEditMode: boolean = false): Observable<DialogData | undefined> {
    return this.dialog
      .open(ExercicioDialogComponent, {
        width: '560px',
        data: {
          ...data,
           isEditMode: isEditMode 
        }
      })
      .afterClosed();
  }
}
