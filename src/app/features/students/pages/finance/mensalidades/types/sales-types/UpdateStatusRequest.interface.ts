export interface UpdateStatusRequest {
  id: number;
  status: 'pago' | 'nao_pago' | 'pendente';
}

export interface UpdateStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    status: string;
    description: string;
    sale_date_formatted: string;
  };
}