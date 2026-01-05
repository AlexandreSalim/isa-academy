import { Expense } from "./Expense.interface";
import { ExpenseSummary } from "./ExpenseSummary.interface";

export interface ExpensesResponse {
  success: boolean;
  data: Expense[];
  summary: ExpenseSummary;
}