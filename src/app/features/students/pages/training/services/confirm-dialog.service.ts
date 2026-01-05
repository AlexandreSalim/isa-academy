// confirm-dialog.service.ts
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../components/comfirm-dialog/confirm-dialog.component';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  constructor(private dialog: MatDialog) {}

  confirm(data?: ConfirmDialogData): Observable<boolean> {

    const ref = this.dialog.open(ConfirmDialogComponent, {
      width: '360px',
      data: data ?? {},
      panelClass: 'app-confirm-panel'
    });

    return ref.afterClosed();
  }
}
