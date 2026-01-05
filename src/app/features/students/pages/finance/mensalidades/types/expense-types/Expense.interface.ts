export interface Expense {
  id: number;
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  expense_date_formatted?: string;
  payment_method: string;
  is_recurring: boolean;
  recurrence_day?: number;
  recurrence_end_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
   status?: 'pago' | 'nao_pago' | 'pendente';
}