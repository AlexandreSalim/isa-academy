import { Component, Inject } from '@angular/core';
import { 
  MAT_DIALOG_DATA, 
  MatDialogRef, 
  MatDialogTitle, 
  MatDialogContent, 
  MatDialogActions, 
  MatDialogClose 
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface DialogData {
  title: string;
  message?: string; // Opcional agora
  options?: DialogOption[]; // Nova propriedade para opções
  confirmText?: string;
  cancelText?: string;
  selectedOption?: string; // Para armazenar a opção selecionada
}

export interface DialogOption {
  label: string;
  value: string;
  checked?: boolean;
}

@Component({
  selector: 'app-dialog-custom',
  standalone: true,  // ← Adicione esta linha
  imports: [         // ← Adicione esta seção de imports
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    
    <mat-dialog-content>
      {{ data.message }}
    </mat-dialog-content>
    
    <mat-dialog-actions align="end" style="color: black">
      <button mat-button (click)="onCancel()">
        {{ data.cancelText || 'Cancelar' }}
      </button>
      <button mat-raised-button style="color: black" (click)="onConfirm()">
        {{ data.confirmText || 'Confirmar' }}
      </button>
    </mat-dialog-actions>
  `
})
export class DialogCustomComponent {
  constructor(
    public dialogRef: MatDialogRef<DialogCustomComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}