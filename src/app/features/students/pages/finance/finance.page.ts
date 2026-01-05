// finance.page.ts
import {
  Component,
  OnInit,
  signal,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { AddEntryModalComponent } from './add-entry-modal/add-entry-modal.component';
import { ModalController } from '@ionic/angular';
import { MonthPickerService } from './month-picker.service';

import { Subscription } from 'rxjs';
import { Sale } from './mensalidades/types/sales-types/Sale.interface';
import { Expense } from './mensalidades/types/expense-types/Expense.interface';

import { SalesService } from './services/sales.service';
import { ExpensesService } from './services/expenses.service';
import { PaymentsService } from '../../service/payments.service';
import { FinanceTotals } from './mensalidades/types/Finance/FinanceTotals.interface';
import { MensalidadeData } from './mensalidades/types/Finance/MensalidadeData.interface';

interface Movement {
  id: number;
  title: string;
  subtitle?: string;
  category?: string;
  value: number;
  paid?: boolean;
  status?: 'pago' | 'nao_pago' | 'pendente';
  date?: string;
  details?: string;
  // Campos para integração
  originalData?: Sale | Expense;
  type?: 'venda' | 'despesa';
}

@Component({
  selector: 'app-finance',
  templateUrl: './finance.page.html',
  styleUrls: ['./finance.page.scss'],
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FinancePage implements OnInit {
  readonly panelOpenState = signal(false);

  // Var exibida no botão (ex: "Dezembro/2025")
  month = '';

  // valores internos
  private monthIndex = new Date().getMonth();
  private year = new Date().getFullYear();
  private mesReferenciaFormatado = '';

  currentAmount = 10000;
  forecast = 20000;

  recebidoPercent = 50; // %
  gastoPercent = 75; // %

  activeTab: 'entradas' | 'saidas' = 'entradas';

  entradas: Movement[] = [];
  saidas: Movement[] = [];

  // Dados reais da API
  vendas: Sale[] = [];
  despesas: Expense[] = [];
  mensalidade: MensalidadeData[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  mensalidadesPagasPercent: number = 0;
  totalMensalidadesPagas: number = 0;
  totalMensalidadesPendentes: number = 0;
  totalMensalidades: number = 0;

  totals: FinanceTotals = {
    recebidoValor: 0,
    faltaReceberValor: 0,
    previstoEntradasValor: 0,
    pagoValor: 0,
    faltaPagarValor: 0,
    previstoSaidasValor: 0,
    recebidoPercent: 0,
    gastoPercent: 0,
    currentAmount: 0,
    forecast: 0,
  };

  private subscription = new Subscription();

  constructor(
    private router: Router,
    private modalCtrl: ModalController,
    private monthPickerService: MonthPickerService,
    private cdr: ChangeDetectorRef,
    private salesService: SalesService,
    private expensesService: ExpensesService,
    private paymentsService: PaymentsService
  ) {
    const d = new Date();
    this.monthIndex = d.getMonth();
    this.year = d.getFullYear();

    // inicializa a string exibida
    this.updateMonthDisplay();
  }

  ngOnInit() {
    this.carregarDados();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateMonthDisplay() {
    // monta "Dezembro/2025" com pt-BR e primeira letra maiúscula
    const d = new Date(this.year, this.monthIndex);
    const monthName = d.toLocaleString('pt-BR', { month: 'long' });
    this.month =
      monthName.charAt(0).toUpperCase() + monthName.slice(1) + '/' + this.year;

    // Formatar para YYYY-MM para uso na API
    const mes = (this.monthIndex + 1).toString().padStart(2, '0');
    this.mesReferenciaFormatado = `${this.year}-${mes}`;

    // se estiver usando OnPush, garantir que o template atualize
    this.cdr.markForCheck();
  }

  // Atualize o método carregarDados()
  carregarDados() {
    this.loading = true;
    this.errorMessage = '';

    // Carregar vendas (entradas)
    this.subscription.add(
      this.salesService
        .getVendas({ month: this.mesReferenciaFormatado })
        .subscribe({
          next: (response) => {
            if (response.success) {
              // Converter strings para números
              this.vendas = response.data.map((venda) => ({
                ...venda,
                unit_price:
                  typeof venda.unit_price === 'string'
                    ? parseFloat(venda.unit_price)
                    : venda.unit_price,
                total_amount:
                  typeof venda.total_amount === 'string'
                    ? parseFloat(venda.total_amount)
                    : venda.total_amount,
              }));

              this.atualizarEntradas();
              this.calcularTotais();
            }
          },
          error: (error) => {
            this.errorMessage = 'Erro ao carregar dados de vendas';
            console.error('Erro vendas:', error);
          },
          complete: () => this.finalizarCarregamento(),
        })
    );

    // Carregar despesas (saídas)
    this.subscription.add(
      this.expensesService
        .getDespesas({ month: this.mesReferenciaFormatado })
        .subscribe({
          next: (response) => {
            if (response.success) {
              // Converter strings para números
              this.despesas = response.data.map((despesa) => ({
                ...despesa,
                amount:
                  typeof despesa.amount === 'string'
                    ? parseFloat(despesa.amount)
                    : despesa.amount,
              }));

              this.atualizarSaidas();
              this.calcularTotais();
            }
          },
          error: (error) => {
            this.errorMessage = 'Erro ao carregar dados de despesas';
            console.error('Erro despesas:', error);
          },
          complete: () => this.finalizarCarregamento(),
        })
    );

    // Carregar mensalidades (alunos)
    this.subscription.add(
      this.paymentsService
        .getPagamentosPorMes(this.mesReferenciaFormatado)
        .subscribe({
          next: (response) => {
            if (response.success) {
              // Processar dados das mensalidades - garantir que valor seja número
              this.mensalidade = response.lista_completa.map((aluno: any) => ({
                usuario_id: aluno.usuario_id,
                name: aluno.name,
                status: aluno.status || 'nao_pago',
                // Converter para número e garantir que seja um valor válido
                valor: Number(aluno.valor) || 80.0,
                data_pagamento: aluno.data_pagamento,
              }));

              this.calcularTotais();
            }
          },
          error: (error) => {
            console.error('Erro ao carregar mensalidades:', error);
            // Não interrompe o carregamento principal se falhar as mensalidades
          },
          complete: () => this.finalizarCarregamento(),
        })
    );
  }

  private finalizarCarregamento() {
    this.loading = false;
    this.cdr.markForCheck();
  }

  // No método atualizarEntradas, adicione debug
  private atualizarEntradas() {
    if (this.vendas.length === 0) {
      this.entradas = [];
      return;
    }

    // Converter vendas para o formato Movement
    this.entradas = this.vendas
      .map((venda, index) => {
        try {
          // Garantir que os valores sejam números
          const unitPrice = Number(venda.unit_price) || 0;
          const totalAmount = Number(venda.total_amount) || 0;

          // Determinar se está pago baseado no status
          const isPaid = venda.status === 'pago';

          return {
            id: venda.id,
            title: venda.description,
            subtitle: this.obterSubtitleVenda(venda),
            value: totalAmount,
            paid: isPaid,
            status: venda.status,
            date: venda.sale_date_formatted || venda.sale_date,
            details: this.obterDetalhesVenda(venda),
            originalData: venda,
            type: 'venda',
          };
        } catch (error) {
          return null;
        }
      })
      .filter((item) => item !== null) as Movement[];
  }

  private obterSubtitleVenda(venda: Sale): string {
    if (venda.quantity > 1) {
      return `${venda.quantity} unidades`;
    }
    return '';
  }

  private obterDetalhesVenda(venda: Sale): string {
    const details = [];
    if (venda.quantity > 1) {
      // Converter unit_price para número se for string
      const unitPrice =
        typeof venda.unit_price === 'string'
          ? parseFloat(venda.unit_price)
          : venda.unit_price;

      details.push(`${venda.quantity} x R$ ${unitPrice.toFixed(2)}`);
    }

    details.push(
      `Método: ${this.formatarMetodoPagamento(venda.payment_method)}`
    );
    return details.join(' | ');
  }

  private formatarMetodoPagamento(metodo: string): string {
    const metodos: { [key: string]: string } = {
      dinheiro: 'Dinheiro',
      cartao_debito: 'Cartão Débito',
      cartao_credito: 'Cartão Crédito',
      pix: 'PIX',
      transferencia: 'Transferência',
    };
    return metodos[metodo] || metodo;
  }

  private atualizarSaidas() {
    // Converter despesas para o formato Movement
    this.saidas = this.despesas.map((despesa) => {
      // Determinar se está pago baseado no status
      const isPaid = despesa.status === 'pago';

      return {
        id: despesa.id,
        title: despesa.description,
        subtitle:
          this.expensesService
            .getCategorias()
            .find((c) => c.valor === despesa.category)?.label ||
          despesa.category,
        value: despesa.amount,
        paid: isPaid, // Agora baseado no status
        status: despesa.status, // Mantemos o status original
        date: despesa.expense_date_formatted || despesa.expense_date,
        details: this.obterDetalhesDespesa(despesa),
        originalData: despesa,
        type: 'despesa',
      };
    });
  }

  private obterDetalhesDespesa(despesa: Expense): string {
    const details = [];
    details.push(
      `Método: ${
        this.expensesService
          .getMetodosPagamento()
          .find((m) => m.valor === despesa.payment_method)?.label ||
        despesa.payment_method
      }`
    );

    if (despesa.is_recurring) {
      details.push('Recorrente');
      if (despesa.recurrence_day) {
        details.push(`Dia ${despesa.recurrence_day}`);
      }
    }

    if (despesa.notes) {
      details.push(despesa.notes);
    }

    return details.join(' | ');
  }

  private calcularTotais() {
    // ================= CALCULAR MENSALIDADES =================

    // Calcular totais específicos para mensalidades
    const mensalidadesPagas = this.mensalidade.filter(
      (m) => m.status === 'pago'
    );
    const mensalidadesPendentes = this.mensalidade.filter(
      (m) => m.status === 'pendente' || m.status === 'nao_pago'
    );

    // Valores em R$
    this.totalMensalidadesPagas = mensalidadesPagas.reduce(
      (sum, mensalidade) => sum + (Number(mensalidade.valor) || 80),
      0
    );

    this.totalMensalidadesPendentes = mensalidadesPendentes.reduce(
      (sum, mensalidade) => sum + (Number(mensalidade.valor) || 80),
      0
    );

    this.totalMensalidades =
      this.totalMensalidadesPagas + this.totalMensalidadesPendentes;

    // Calcular porcentagem de mensalidades pagas
    this.mensalidadesPagasPercent =
      this.totalMensalidades > 0
        ? Math.round(
            (this.totalMensalidadesPagas / this.totalMensalidades) * 100
          )
        : 0;

    // ================= CALCULAR VENDAS =================

    // Vendas pagas
    const vendasPagas = this.vendas.filter((v) => v.status === 'pago');
    const totalVendasPagas = vendasPagas.reduce(
      (sum, venda) => sum + venda.total_amount,
      0
    );

    // Vendas pendentes
    const vendasPendentes = this.vendas.filter(
      (v) => v.status === 'pendente' || v.status === 'nao_pago'
    );
    const totalVendasPendentes = vendasPendentes.reduce(
      (sum, venda) => sum + venda.total_amount,
      0
    );

    // ================= CALCULAR SAÍDAS =================

    // Despesas pagas
    const despesasPagas = this.despesas.filter((d) => d.status === 'pago');
    const totalDespesasPagas = despesasPagas.reduce(
      (sum, despesa) => sum + despesa.amount,
      0
    );

    // Despesas pendentes
    const despesasPendentes = this.despesas.filter(
      (d) => d.status === 'pendente' || d.status === 'nao_pago'
    );
    const totalDespesasPendentes = despesasPendentes.reduce(
      (sum, despesa) => sum + despesa.amount,
      0
    );

    // ================= CALCULAR TOTAIS FINAIS =================

    // Card RECEBIDO
    this.totals.recebidoValor = this.totalMensalidadesPagas + totalVendasPagas;
    this.totals.faltaReceberValor =
      this.totalMensalidadesPendentes + totalVendasPendentes;

    this.totals.previstoEntradasValor =
      this.totalMensalidades +
      this.vendas.reduce((sum, v) => sum + v.total_amount, 0);

    // Card GASTO
    this.totals.pagoValor = totalDespesasPagas;
    this.totals.faltaPagarValor = totalDespesasPendentes;
    this.totals.previstoSaidasValor = this.despesas.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    // Calcular porcentagens - adicionar verificação para evitar divisão por zero
    this.totals.recebidoPercent =
      this.totals.previstoEntradasValor > 0
        ? Math.min(
            100,
            Math.round(
              (this.totals.recebidoValor / this.totals.previstoEntradasValor) *
                100
            )
          )
        : 0;

    this.totals.gastoPercent =
      this.totals.previstoSaidasValor > 0
        ? Math.min(
            100,
            Math.round(
              (this.totals.pagoValor / this.totals.previstoSaidasValor) * 100
            )
          )
        : 0;

    // Situação atual (Recebido - Pago)
    this.totals.currentAmount =
      this.totals.recebidoValor - this.totals.pagoValor;
    this.totals.forecast = this.totals.previstoEntradasValor;
  }

  setTab(t: 'entradas' | 'saidas') {
    this.activeTab = t;
  }

  formatCurrency(v: number) {
    if (v === null || v === undefined) return 'R$ 0,00';
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  togglePaid(item: Movement) {
    // Se for venda, usa a lógica de vendas
    if (item.type === 'venda') {
      const currentStatus = item.status || 'pago';
      let newStatus: 'pago' | 'pendente' =
        currentStatus === 'pago' ? 'pendente' : 'pago';

      this.loading = true;

      this.subscription.add(
        this.salesService.atualizarStatusVenda(item.id, newStatus).subscribe({
          next: (response) => {
            if (response.success) {
              item.status = newStatus;
              item.paid = newStatus === 'pago';
              // Mostrar mensagem de sucesso
              this.successMessage = `Status alterado para: ${
                newStatus === 'pago' ? 'Pago' : 'Pendente'
              }`;

              // Limpar mensagem após 3 segundos
              setTimeout(() => {
                this.successMessage = '';
                this.cdr.markForCheck();
              }, 3000);

              const vendaIndex = this.vendas.findIndex((v) => v.id === item.id);
              if (vendaIndex !== -1) {
                this.vendas[vendaIndex].status = newStatus;
              }

              this.calcularTotais();
            }
            this.loading = false;
            this.cdr.markForCheck();
          },
          error: (error) => {
            console.error('Erro ao atualizar status da venda:', error);
            this.errorMessage = 'Erro ao atualizar status da venda';
            this.loading = false;
            this.cdr.markForCheck();
          },
        })
      );
    }
    // Se for despesa, usa a lógica de despesas
    else if (item.type === 'despesa') {
      const currentStatus = item.status || 'pago';
      let newStatus: 'pago' | 'pendente' =
        currentStatus === 'pago' ? 'pendente' : 'pago';

      this.loading = true;

      this.subscription.add(
        this.expensesService
          .atualizarStatusDespesa(item.id, newStatus)
          .subscribe({
            next: (response) => {
              if (response.success) {
                item.status = newStatus;
                item.paid = newStatus === 'pago';
                // Mostrar mensagem de sucesso
                this.successMessage = `Status alterado para: ${
                  newStatus === 'pago' ? 'Pago' : 'Pendente'
                }`;

                // Limpar mensagem após 3 segundos
                setTimeout(() => {
                  this.successMessage = '';
                  this.cdr.markForCheck();
                }, 3000);

                const despesaIndex = this.despesas.findIndex(
                  (d) => d.id === item.id
                );
                if (despesaIndex !== -1) {
                  this.despesas[despesaIndex].status = newStatus;
                }

                this.calcularTotais();
              }
              this.loading = false;
              this.cdr.markForCheck();
            },
            error: (error) => {
              console.error('Erro ao atualizar status da despesa:', error);
              this.errorMessage = 'Erro ao atualizar status da despesa';
              this.loading = false;
              this.cdr.markForCheck();
            },
          })
      );
    }
  }

  async openAddEntry() {
    const modal = await this.modalCtrl.create({
      component: AddEntryModalComponent,
      cssClass: 'custom-add-entry-modal',
      componentProps: {
        mode: this.activeTab, // 'entradas' | 'saidas'
        // Passar dados adicionais se necessário
        categorias: this.expensesService.getCategorias(),
        metodosPagamento: [
          ...this.expensesService.getMetodosPagamento(),
          ...(this.salesService.getMetodosPagamento?.() || []),
        ],
      },
    });

    await modal.present();
    const { data } = await modal.onDidDismiss();
    if (data) {
      // Processar os dados baseado no modo
      if (this.activeTab === 'entradas') {
        this.processarNovaVenda(data);
      } else {
        this.processarNovaDespesa(data);
      }
    } else {
      // console.log('cancelado');
    }
  }

  private processarNovaVenda(data: any) {
    this.loading = true;

    // Mapear dados do modal para o formato da API de vendas
    const vendaData = {
      description: data.title,
      quantity: data.quantity || 1,
      unit_price: data.unit_price || data.value,
      sale_date: data.date
        ? data.date.split('T')[0]
        : new Date().toISOString().split('T')[0],
      payment_method: data.payment_method || 'dinheiro',
    };

    this.subscription.add(
      this.salesService.criarVenda(vendaData).subscribe({
        next: (response) => {
          if (response.success) {
            this.carregarDados(); // Recarregar dados
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorMessage = 'Erro ao criar venda';
          this.loading = false;
          this.cdr.markForCheck();
        },
      })
    );
  }

  private processarNovaDespesa(data: any) {
    this.loading = true;

    // Mapear dados do modal para o formato da API de despesas
    const despesaData = {
      description: data.title,
      category: data.category || 'outros',
      amount: data.value || data.amount,
      expense_date: data.date
        ? data.date.split('T')[0]
        : new Date().toISOString().split('T')[0],
      payment_method: data.payment_method || 'dinheiro',
      is_recurring: data.repeat === 'monthly',
      recurrence_day: data.recurrence_day,
      notes: data.notes || '',
    };

    this.subscription.add(
      this.expensesService.criarDespesa(despesaData).subscribe({
        next: (response) => {
          if (response.success) {
            this.carregarDados(); // Recarregar dados
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.errorMessage = 'Erro ao criar despesa';
          this.loading = false;
          this.cdr.markForCheck();
        },
      })
    );
  }

  async openMonthPicker() {
    const res = await this.monthPickerService.open({
      startYear: new Date().getFullYear() - 3,
      endYear: new Date().getFullYear() + 3,
      initialMonth: this.monthIndex,
      initialYear: this.year,
      okText: 'OK',
      cancelText: 'Cancelar',
    });

    if (res) {
      this.monthIndex = Number(res.monthIndex);
      this.year = Number(res.year);
      this.updateMonthDisplay();
      this.cdr.markForCheck();
      this.carregarDados(); // Recarregar dados para o novo mês
    }
  }

  mensalidades() {
    this.router.navigate(['/students/finance/mensalidades']);
  }

  back() {
    this.router.navigate(['./']);
  }

  // Método para excluir uma entrada/saída
  async excluirMovimentacao(item: Movement, index: number, lista: Movement[]) {
    // Implementar confirmação e exclusão
    if (confirm(`Tem certeza que deseja excluir "${item.title}"?`)) {
      if (item.type === 'venda') {
        this.excluirVenda(item.id);
      } else if (item.type === 'despesa') {
        this.excluirDespesa(item.id);
      }
      lista.splice(index, 1);
      this.calcularTotais();
      this.cdr.markForCheck();
    }
  }

  private excluirVenda(id: number) {
    this.subscription.add(
      this.salesService.excluirVenda(id).subscribe({
        next: () => console.log('Venda excluída'),
        error: (error) => console.error('Erro ao excluir venda:', error),
      })
    );
  }

  private excluirDespesa(id: number) {
    this.subscription.add(
      this.expensesService.excluirDespesa(id).subscribe({
        next: () => console.log('Despesa excluída'),
        error: (error) => console.error('Erro ao excluir despesa:', error),
      })
    );
  }
}
