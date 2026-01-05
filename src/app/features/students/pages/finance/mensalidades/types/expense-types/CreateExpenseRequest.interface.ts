export interface CreateExpenseRequest {
  description: string;
  category: string;
  amount: number;
  expense_date?: string;
  payment_method?: string;
  is_recurring?: boolean;
  recurrence_day?: number;
  recurrence_end_date?: string;
  notes?: string;
}
