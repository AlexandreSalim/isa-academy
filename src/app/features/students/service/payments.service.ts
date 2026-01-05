import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { PaymentResponse } from '../pages/finance/mensalidades/types/PaymentResponse.interface';
import { UpdatePaymentStatusResponse } from '../pages/finance/mensalidades/types/UpdatePaymentStatusResponse.interface';

@Injectable({
  providedIn: 'root',
})
export class PaymentsService {
  private apiBase = environment.apiUrl + '/user_payments/';

  constructor(private http: HttpClient) {}

  desmarcarPagamento(userId: number, mesReferencia: string): Observable<any> {
  return this.http.delete(`${this.apiBase}delete_user_payment.php`, {
    body: {
      user_id: userId,
      mes_referencia: mesReferencia
    }
  }).pipe(
    catchError(this.handleError)
  );
}

  // Registrar um pagamento

  registrarPagamento(user_id: number, mes_referencia: string, status: string = 'pago') {
    return this.http.post<UpdatePaymentStatusResponse>(`${this.apiBase}create_user_payments.php`, {
      user_id: user_id,
      mes_referencia: mes_referencia,
      status: status
    });
  }

  // Buscar pagamentos por mês
  getPagamentosPorMes(mesReferencia: string): Observable<PaymentResponse> {
    let params = new HttpParams();
    if (mesReferencia) {
      params = params.set('mes', mesReferencia);
    }
    
    return this.http.get<PaymentResponse>(`${this.apiBase}get_payments_by_month.php`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Formatar data para YYYY-MM (para uso com a API)
  formatarMesParaAPI(data: Date): string {
    const ano = data.getFullYear();
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    return `${ano}-${mes}`;
  }

  // Converter string de mês (ex: "Dezembro/2025") para YYYY-MM
  parseMesString(mesString: string): string {
    const partes = mesString.split('/');
    if (partes.length === 2) {
      const mesesPT = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      const nomeMes = partes[0];
      const ano = partes[1];
      const mesIndex = mesesPT.findIndex(m => m.toLowerCase() === nomeMes.toLowerCase());
      
      if (mesIndex !== -1) {
        const mes = (mesIndex + 1).toString().padStart(2, '0');
        return `${ano}-${mes}`;
      }
    }
    
    // Fallback: usar mês atual
    return this.formatarMesParaAPI(new Date());
  }

   atualizarStatusPagamento(id: number, status: string) {
    return this.http.patch<UpdatePaymentStatusResponse>(
      `${this.apiBase}update_payments_status.php`, 
      {
        id: id,
        status: status
      }
    );
  }

  // Manipular erro
  private handleError(error: any) {
    console.error('Erro no serviço de pagamentos:', error);
    let errorMessage = 'Erro ao processar pagamento';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}