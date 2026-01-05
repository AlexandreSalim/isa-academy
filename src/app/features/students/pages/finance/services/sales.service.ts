import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { SalesResponse } from '../mensalidades/types/sales-types/SalesResponse.interface';
import { CreateSaleRequest } from '../mensalidades/types/sales-types/CreateSaleRequest.interface';
import { SaleSummaryResponse } from '../mensalidades/types/sales-types/SaleSummaryResponse.interface';
import { UpdateStatusResponse } from '../mensalidades/types/sales-types/UpdateStatusRequest.interface';

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private apiBase = environment.apiUrl + '/sales_entry/';

  constructor(private http: HttpClient) {}

  // Buscar todas as vendas com filtros
  getVendas(filtros?: {
    month?: string;
    start_date?: string;
    end_date?: string;
  }): Observable<SalesResponse> {
    let params = new HttpParams();

    if (filtros?.month) {
      params = params.set('month', filtros.month);
    }

    if (filtros?.start_date && filtros?.end_date) {
      params = params.set('start_date', filtros.start_date);
      params = params.set('end_date', filtros.end_date);
    }

    return this.http
      .get<SalesResponse>(`${this.apiBase}get_sales_entries.php`, { params })
      .pipe(
        map((response) => {
          // Formatar datas para exibição
          if (response.data) {
            response.data = response.data.map((sale) => ({
              ...sale,
              sale_date_formatted: this.formatarData(sale.sale_date),
              total_amount: Number(sale.total_amount),
            }));
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  // Criar nova venda
  criarVenda(venda: CreateSaleRequest): Observable<any> {
    return this.http
      .post(`${this.apiBase}create_sales_entry.php`, venda)
      .pipe(catchError(this.handleError));
  }

  // Atualizar venda
  atualizarVenda(id: number, venda: CreateSaleRequest): Observable<any> {
    return this.http
      .put(`${this.apiBase}update_sales_entry.php`, { id, ...venda })
      .pipe(catchError(this.handleError));
  }

  // Excluir venda
  excluirVenda(id: number): Observable<any> {
    return this.http
      .delete(`${this.apiBase}delete_sales_entry.php`, {
        body: { id },
      })
      .pipe(catchError(this.handleError));
  }

  // Buscar resumo de vendas
  getResumoVendas(
    startDate: string,
    endDate: string
  ): Observable<SaleSummaryResponse> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);

    return this.http
      .get<SaleSummaryResponse>(`${this.apiBase}get_sales_summary.php`, {
        params,
      })
      .pipe(catchError(this.handleError));
  }

  // Formatar data para exibição
  private formatarData(data: string): string {
    if (!data) return '';
    const date = new Date(data);
    return date.toLocaleDateString('pt-BR');
  }

  // Formatar data para YYYY-MM-DD (para a API)
  formatarDataParaAPI(data: Date): string {
    const ano = data.getFullYear();
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const dia = data.getDate().toString().padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  // Obter métodos de pagamento
  getMetodosPagamento(): Array<{ valor: string; label: string }> {
    return [
      { valor: 'dinheiro', label: 'Dinheiro' },
      { valor: 'cartao_debito', label: 'Cartão de Débito' },
      { valor: 'cartao_credito', label: 'Cartão de Crédito' },
      { valor: 'pix', label: 'PIX' },
      { valor: 'transferencia', label: 'Transferência' },
      { valor: 'boleto', label: 'Boleto' },
    ];
  }

  atualizarStatusVenda(id: number, status: string) {
    return this.http.patch<UpdateStatusResponse>(
      `${this.apiBase}update_sale_status.php`,
      {
        id: id,
        status: status,
      }
    );
  }

  // Manipular erro
  private handleError(error: any) {
    console.error('Erro no serviço de vendas:', error);
    let errorMessage = 'Erro ao processar venda';

    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
}
