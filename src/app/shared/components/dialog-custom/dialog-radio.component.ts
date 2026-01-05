// dialog-custom.component.ts
import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule } from '@angular/forms';


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
  selector: 'app-dialog-radio',
  standalone: true,
  imports: [
    FormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButtonModule,
    MatRadioModule
],
  template: `
    <div class="title">
      <h2 mat-dialog-title style="color: #00061C; font-size: 20px;padding: 0;">
        {{ data.title }}
      </h2>
    </div>
    
    <mat-dialog-content>
      <!-- Mensagem principal (opcional) -->
      <div class="text">
        @if (data.message) {
          <p>{{ data.message }}</p>
        }
      </div>
    
      <!-- Opções de rádio -->
      <mat-radio-group [(ngModel)]="selectedOption" class="radio-group">
        @for (option of data.options; track option) {
          <mat-radio-button
            [value]="option.value"
            [checked]="option.checked"
            class="radio-button"
            >
            {{ option.label }}
          </mat-radio-button>
        }
      </mat-radio-group>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <section style="display: flex;gap:8px;justify-content: space-between;width:100%">
        <div class="cancelar">
          <button mat-button (click)="onCancel()">
            {{ data.cancelText || 'Cancelar' }}
          </button>
        </div>
    
        <div class="criar">
          <button mat-raised-button (click)="onConfirm()">
            {{ data.confirmText || 'Confirmar' }}
          </button>
        </div>
      </section>
    </mat-dialog-actions>
    `,
  styles: [
    `
      .title {
        text-align: center;
      }
      .text {
      }
      .radio-group {
        display: flex;
        flex-direction: column;
      }
      .radio-button {
        font-size: 17px;
        padding: 5px 0;
        color: #00061c;
      }
      mat-dialog-content {
        min-width: 300px;
      }
      .cancelar {
        width: 38%;
        height: 40px;
        background-color: #d9d9d9;
        color: #020b2a;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .criar {
        border-radius: 10px;
        width: 58%;
        height: 40px;
        background-color: #020b2a;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    `,
  ],
})
export class DialogRadioComponent {
  selectedOption: string = '';

  constructor(
    public dialogRef: MatDialogRef<DialogRadioComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    // Define a opção padrão (primeira marcada como checked ou a primeira da lista)
    const defaultOption =
      data.options?.find((opt) => opt.checked) || data.options?.[0];
    this.selectedOption = defaultOption?.value || '';
  }

  onConfirm(): void {
    // Retorna a opção selecionada
    this.dialogRef.close({
      confirmed: true,
      selectedOption: this.selectedOption,
    });
  }

  onCancel(): void {
    this.dialogRef.close({
      confirmed: false,
      selectedOption: null,
    });
  }
}
