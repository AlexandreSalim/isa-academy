import { Sale } from "./Sale.interface";
import { SalesSummary } from "./SalesSummary.interface";

export interface SalesResponse {
  success: boolean;
  data: Sale[];
  summary: SalesSummary;
}
