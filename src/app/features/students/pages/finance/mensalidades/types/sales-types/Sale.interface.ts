export interface Sale {
  id: number;
  description: string;
  quantity: number;
  unit_price: number | string;
  total_amount: number;
  sale_date: string;
  sale_date_formatted?: string;
  payment_method: string;
  created_at: string;
  updated_at: string;
  status?: 'pago' | 'nao_pago' | 'pendente';
}
