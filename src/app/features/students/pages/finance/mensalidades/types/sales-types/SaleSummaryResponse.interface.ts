export interface SaleSummaryResponse {
  success: boolean;
  period: {
    start_date: string;
    end_date: string;
  };
  daily_sales: Array<{
    sale_date: string;
    total_dia: number;
    qtd_vendas: number;
    metodos_pagamento: string;
  }>;
  payment_summary: Array<{
    payment_method: string;
    total: number;
    qtd: number;
  }>;
  total_summary: {
    total_geral: number;
    total_vendas: number;
    total_itens: number;
  };
}