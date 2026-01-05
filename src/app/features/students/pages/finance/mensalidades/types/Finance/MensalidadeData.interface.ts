export interface MensalidadeData {
  usuario_id: number;
  name: string;
  status: 'pago' | 'nao_pago' | 'pendente';
  valor?: number;
  data_pagamento?: string;
}