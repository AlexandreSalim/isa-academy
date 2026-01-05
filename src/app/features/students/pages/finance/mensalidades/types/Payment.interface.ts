export interface Payment {
  pagamento_id: number;
  id: number; // Para compatibilidade
  user_id: number;
  usuario_id: number; // Mesmo que user_id
  valor: number;
  data_pagamento_formatada: string;
  data_pagamento: string;
  mes_referencia: string;
  created_at: string;
  name: string;
  surname: string;
  contact: string;
  status_pagamento: 'Pago' | 'Não pago'; // Mantém para compatibilidade
  status: 'pago' | 'nao_pago' | 'pendente'; // Novo campo
  user_status?: string; // Status do usuário (em dia, etc)
}