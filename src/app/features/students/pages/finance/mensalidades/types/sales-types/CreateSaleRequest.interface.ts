export interface CreateSaleRequest {
  description: string;
  quantity: number;
  unit_price: number;
  sale_date?: string;
  payment_method?: string;
}