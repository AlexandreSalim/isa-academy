export interface UpdatePaymentStatusResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    user_id: number;
    user_name: string;
    valor: number;
    status: string;
    data_pagamento: string | null;
    data_pagamento_formatada: string | null;
    mes_referencia: string;
    mes_referencia_formatada: string;
  };
}