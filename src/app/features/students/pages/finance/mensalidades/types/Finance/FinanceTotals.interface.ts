export interface FinanceTotals {
  // Card Recebido (Entradas)
  recebidoValor: number; // alunos pagos + vendas pagas
  faltaReceberValor: number; // alunos pendentes + vendas pendentes
  previstoEntradasValor: number; // todos alunos + todas vendas
  
  // Card Gasto (Saídas)
  pagoValor: number; // despesas pagas
  faltaPagarValor: number; // despesas pendentes
  previstoSaidasValor: number; // todas despesas
  
  // Porcentagens
  recebidoPercent: number;
  gastoPercent: number;
  
  // Situação atual
  currentAmount: number;
  forecast: number;
}