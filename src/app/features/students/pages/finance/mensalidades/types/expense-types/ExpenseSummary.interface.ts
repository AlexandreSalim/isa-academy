import { Expense } from "./Expense.interface";

export interface ExpenseSummary {
  total_expenses: string;
  total_items: number;
  categories: { [key: string]: number };
  payment_methods: { [key: string]: number };
  recurring_count: number;
  recurring_expenses: Expense[];
}