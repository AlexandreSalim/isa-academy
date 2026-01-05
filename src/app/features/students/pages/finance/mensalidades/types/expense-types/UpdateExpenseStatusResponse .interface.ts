export interface UpdateExpenseStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    description: string;
    expense_date_formatted: string;
  };
}