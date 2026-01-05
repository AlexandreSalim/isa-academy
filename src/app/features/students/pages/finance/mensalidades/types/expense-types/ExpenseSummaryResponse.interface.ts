export interface ExpenseSummaryResponse {
  success: boolean;
  period: {
    start_date: string;
    end_date: string;
  };
  category_summary: Array<{
    category: string;
    total: number;
    qtd: number;
  }>;
  payment_summary: Array<{
    payment_method: string;
    total: number;
    qtd: number;
  }>;
  daily_expenses: Array<{
    expense_date: string;
    total_dia: number;
    qtd_despesas: number;
    categorias: string;
  }>;
  total_summary: {
    total_geral: number;
    total_despesas: number;
  };
  recurring_summary: {
    total_recorrentes: number;
    total_recorrente: number;
  };
}