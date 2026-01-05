export interface SalesSummary {
  total_sales: string;
  total_quantity: number;
  total_items: number;
  payment_methods: { [key: string]: number };
}