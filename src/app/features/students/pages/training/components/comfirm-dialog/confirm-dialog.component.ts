// confirm-dialog.component.ts
import { Component, Inject } from '@angular/core';

import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean; // marca botão de confirmar em vermelho
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirm-root">
      <div class="header">
        <h3>{{ data.title || 'Confirmar' }}</h3>
      </div>

      <div class="message">
        <p [innerHTML]="data.message || 'Tem certeza?'"></p>
      </div>

      <div class="actions">
        <button mat-stroked-button class="btn-cancel" (click)="onCancel()">
          {{ data.cancelText || 'Cancelar' }}
        </button>

        <button
          mat-flat-button
          [class.destructive]="data.destructive"
          color="primary"
          (click)="onConfirm()"
        >
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .confirm-root {
        padding: 18px 20px;
        font-family: 'Montserrat', sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;
        color: red;
      }
      .header mat-icon {
        font-size: 24px;
        color: #0b1d3a;
      }
      .header h3 {
        margin: 0;
        font-size: 16px;
      }
      .message p {
        margin: 8px 0 16px;
        color: #444;
        font-size: 14px;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        width: 100%;
      }
      button.destructive,
      .mat-flat-button.destructive {
        background: #e53935;
        color: white;
        width: 58%;
        border-radius: 10px;
      }
      .btn-cancel {
        background: #d9d9d9;
        color: black !important;
        border: none;
        width: 38%;
        border-radius: 10px;
      }
    `,
  ],
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onConfirm() {
    this.dialogRef.close(true);
  }
  onCancel() {
    this.dialogRef.close(false);
  }
}
