import { Payment } from "./Payment.interface";
import { PaymentTotals } from "./PaymentTotals.interface";

export interface PaymentResponse {
  success: boolean;
  mes_referencia: string;
  data_mes_referencia: string;
  totais: {
    total_alunos: number;
    total_pagos: number;
    total_nao_pagos: number;
    total_recebido: string;
    porcentagem_pagos: string;
    valor_esperado: string;
    diferenca: string;
  };
  lista_completa: any[]; // Todos os alunos com status
  alunos_pagos: any[];
  alunos_nao_pagos: any[];
}