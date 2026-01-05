// dialog.service.ts
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import {
  DialogCustomComponent,
  DialogData,
} from '../../shared/components/dialog-custom/dialog-custom.component';
import {
  DialogRadioComponent,
  DialogOption,
} from '../../shared/components/dialog-custom/dialog-radio.component';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(private dialog: MatDialog) {}

  // Dialog simples (sim/não)
  confirm(data: DialogData): Observable<boolean> {
    return this.dialog.open(DialogCustomComponent, { data }).afterClosed();
  }

  // Dialog com opções de rádio
  chooseOption(
    data: DialogData
  ): Observable<{ confirmed: boolean; selectedOption: string }> {
    return this.dialog.open(DialogRadioComponent, { data }).afterClosed();
  }

  // Método showToast simples (opcional - você pode usar outro serviço para toasts)
  showToast(message: string, duration: number = 3000): void {
    // Implementação simples usando alert para agora
    // Você pode substituir por um componente de Toast real depois

    // Opção 1: Usar alert temporário
    // alert(message); // Comente se não quiser alert

    // Opção 2: Criar um elemento de toast simples
    this.createSimpleToast(message, duration);
  }

  private createSimpleToast(message: string, duration: number): void {
    // Cria um elemento de toast simples
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #4CAF50;
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      font-size: 14px;
      max-width: 80%;
      text-align: center;
      animation: fadeIn 0.3s, fadeOut 0.3s ${duration}ms forwards;
    `;

    // Adiciona estilos CSS para animações
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, 20px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
    `;
    document.head.appendChild(style);

    toast.textContent = message;
    document.body.appendChild(toast);

    // Remove após a duração
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    }, duration + 300);
  }
}
