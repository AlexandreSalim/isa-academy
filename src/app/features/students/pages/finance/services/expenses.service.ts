import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { ExpensesResponse } from '../mensalidades/types/expense-types/ExpensesResponse.interface';
import { CreateExpenseRequest } from '../mensalidades/types/expense-types/CreateExpenseRequest.interface';
import { ExpenseSummaryResponse } from '../mensalidades/types/expense-types/ExpenseSummaryResponse.interface';
import { UpdateExpenseStatusResponse } from '../mensalidades/types/expense-types/UpdateExpenseStatusResponse .interface';


@Injectable({
  providedIn: 'root',
})
export class ExpensesService {
  private apiBase = environment.apiUrl + '/expenses/';

  constructor(private http: HttpClient) {}

  // Buscar todas as despesas com filtros
  getDespesas(filtros?: { 
    month?: string; 
    category?: string; 
    is_recurring?: boolean;
    start_date?: string;
    end_date?: string;
  }): Observable<ExpensesResponse> {
    let params = new HttpParams();
    
    if (filtros?.month) {
      params = params.set('month', filtros.month);
    }
    
    if (filtros?.category) {
      params = params.set('category', filtros.category);
    }
    
    if (filtros?.is_recurring !== undefined) {
      params = params.set('is_recurring', filtros.is_recurring ? '1' : '0');
    }
    
    if (filtros?.start_date && filtros?.end_date) {
      params = params.set('start_date', filtros.start_date);
      params = params.set('end_date', filtros.end_date);
    }
    
    return this.http.get<ExpensesResponse>(`${this.apiBase}get_expenses.php`, { params })
      .pipe(
        map(response => {
          // Formatar datas para exibição
          if (response.data) {
            response.data = response.data.map(expense => ({
              ...expense,
              expense_date_formatted: this.formatarData(expense.expense_date),
              amount: Number(expense.amount),
              is_recurring: Boolean(expense.is_recurring)
            }));
          }
          return response;
        }),
        catchError(this.handleError)
      );
  }

  // Criar nova despesa
  criarDespesa(despesa: CreateExpenseRequest): Observable<any> {
    return this.http.post(`${this.apiBase}create_expense.php`, despesa)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Atualizar despesa
  atualizarDespesa(id: number, despesa: CreateExpenseRequest): Observable<any> {
    return this.http.put(`${this.apiBase}update_expense.php`, { id, ...despesa })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Excluir despesa
  excluirDespesa(id: number): Observable<any> {
    return this.http.delete(`${this.apiBase}delete_expense.php`, {
      body: { id }
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Buscar resumo de despesas
  getResumoDespesas(startDate: string, endDate: string): Observable<ExpenseSummaryResponse> {
    let params = new HttpParams()
      .set('start_date', startDate)
      .set('end_date', endDate);
    
    return this.http.get<ExpenseSummaryResponse>(`${this.apiBase}get_expenses_summary.php`, { params })
      .pipe(
        catchError(this.handleError)
      );
  }

  // Gerar despesas recorrentes do mês
  gerarDespesasRecorrentes(mesReferencia: string): Observable<any> {
    return this.http.post(`${this.apiBase}generate_recurring_expenses.php`, {
      month_reference: mesReferencia
    }).pipe(
      catchError(this.handleError)
    );
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

  // Formatar mês para YYYY-MM (para a API)
  formatarMesParaAPI(data: Date): string {
    const ano = data.getFullYear();
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    return `${ano}-${mes}`;
  }

  // Obter categorias disponíveis
  getCategorias(): Array<{ valor: string, label: string }> {
    return [
      { valor: 'agua', label: 'Água' },
      { valor: 'luz', label: 'Luz' },
      { valor: 'aluguel', label: 'Aluguel' },
      { valor: 'manutencao_equipamentos', label: 'Manutenção de Equipamentos' },
      { valor: 'material_treino', label: 'Material de Treino' },
      { valor: 'folha_pagamento', label: 'Folha de Pagamento' },
      { valor: 'marketing', label: 'Marketing' },
      { valor: 'limpeza', label: 'Limpeza' },
      { valor: 'seguranca', label: 'Segurança' },
      { valor: 'outros', label: 'Outros' }
    ];
  }

  // Obter métodos de pagamento
  getMetodosPagamento(): Array<{ valor: string, label: string }> {
    return [
      { valor: 'dinheiro', label: 'Dinheiro' },
      { valor: 'cartao_debito', label: 'Cartão de Débito' },
      { valor: 'cartao_credito', label: 'Cartão de Crédito' },
      { valor: 'pix', label: 'PIX' },
      { valor: 'transferencia', label: 'Transferência' },
      { valor: 'boleto', label: 'Boleto' }
    ];
  }

  atualizarStatusDespesa(id: number, status: string) {
    return this.http.patch<UpdateExpenseStatusResponse>(
      `${this.apiBase}update_expense_status.php`, 
      {
        id: id,
        status: status
      }
    );
  }

  // Manipular erro
  private handleError(error: any) {
    console.error('Erro no serviço de despesas:', error);
    let errorMessage = 'Erro ao processar despesa';
    
    if (error.error?.error) {
      errorMessage = error.error.error;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}