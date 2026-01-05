import { 
  Component, 
  OnInit, 
  OnDestroy, 
  ChangeDetectorRef 
} from '@angular/core';
import { 
  MonthPickerService 
} from '../month-picker.service';
import { 
  Router 
} from '@angular/router';
import { 
  PaymentsService 
} from '../../../service/payments.service';
import { 
  StudentsService 
} from 'src/app/core/services/StudentsService';
import { 
  Subscription 
} from 'rxjs';
import { 
  AlertController 
} from '@ionic/angular'; // Importar AlertController

@Component({
  selector: 'app-mensalidades',
  templateUrl: './mensalidades.page.html',
  styleUrls: ['./mensalidades.page.scss'],
  standalone: false
})
export class MensalidadesPage implements OnInit, OnDestroy {
  // Lista de todos os alunos com status de pagamento
  listaAlunos: any[] = [];
  
  // Para compatibilidade com o template antigo
  infos: any[] = [];
  
  // Estatísticas
  totals = {
    totalAlunos: 0,
    totalPagos: 0,
    porcentagemPagos: '0%',
    totalRecebido: 'R$ 0,00'
  };
  
  // Paginação
  pageSize = 10;
  currentPage = 1;
  
  // Mês atual
  month = '';
  private monthIndex = 0;
  private year = new Date().getFullYear();
  private mesReferenciaFormatado = '';
  
  // Filtros
  searchTerm = '';
  showFilter = false;
  selectedFilter: '' | 'A-Z' | 'Z-A' | 'Pago' | 'Não pago' = '';
  
  // Estados
  loading = false;
  errorMessage = '';
  
  private subscription = new Subscription();

  constructor(
    private cdr: ChangeDetectorRef,
    private monthPickerService: MonthPickerService,
    private router: Router,
    private paymentsService: PaymentsService,
    private studentsService: StudentsService,
    private alertController: AlertController // Adicionar AlertController
  ) {
    const d = new Date();
    this.monthIndex = d.getMonth();
    this.year = d.getFullYear();
    this.updateMonthDisplay();
  }

  ngOnInit() {
    this.carregarDadosMensalidades();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  private updateMonthDisplay() {
    const d = new Date(this.year, this.monthIndex);
    const monthName = d.toLocaleString('pt-BR', { month: 'long' });
    this.month = monthName.charAt(0).toUpperCase() + monthName.slice(1) + '/' + this.year;
    
    // Formatar para YYYY-MM para uso na API
    const mes = (this.monthIndex + 1).toString().padStart(2, '0');
    this.mesReferenciaFormatado = `${this.year}-${mes}`;
    
    this.cdr.markForCheck();
  }

  async openMonthPicker() {
    const res = await this.monthPickerService.open({
      startYear: this.year - 3,
      endYear: this.year + 3,
      initialMonth: this.monthIndex,
      initialYear: this.year,
      okText: 'OK',
      cancelText: 'Cancelar',
    });

    if (res) {
      this.monthIndex = Number(res.monthIndex);
      this.year = Number(res.year);
      this.updateMonthDisplay();
      this.carregarDadosMensalidades();
    }
  }

carregarDadosMensalidades() {
  this.loading = true;
  this.errorMessage = '';
  
  this.subscription.add(
    this.paymentsService.getPagamentosPorMes(this.mesReferenciaFormatado)
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            // Armazenar a lista completa de alunos
            this.listaAlunos = response.lista_completa;
            
            // Converter para o formato antigo (para manter compatibilidade)
            this.infos = this.listaAlunos.map(aluno => ({
              aluno: `${aluno.name} ${aluno.surname || ''}`.trim(),
              vencimento: this.extrairDiaVencimento(aluno),
              pago: aluno.status === 'pago', // Agora usa o campo status
              status: aluno.status || 'pendente', // Guarda o status completo
              user_id: aluno.usuario_id || aluno.user_id,
              payment_id: aluno.pagamento_id || null, // Adicione o ID do pagamento
              data_pagamento: aluno.data_pagamento_formatada || '',
              dados_completos: aluno // Mantém dados completos para referência
            }));
            
            // Atualizar estatísticas
            this.totals = {
              totalAlunos: response.totais.total_alunos,
              totalPagos: response.totais.total_pagos,
              porcentagemPagos: response.totais.porcentagem_pagos,
              totalRecebido: `R$ ${response.totais.total_recebido}`
            };
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erro ao carregar mensalidades:', error);
          this.errorMessage = error.message || 'Erro ao carregar dados';
          this.loading = false;
          this.cdr.markForCheck();
        }
      })
  );
}

  // Gerar um dia de vencimento fictício baseado no ID do aluno
  private extrairDiaVencimento(aluno: any): string {
    const id = aluno.usuario_id || aluno.user_id || 1;
    const dia = (id % 28) + 1; // Garante um dia entre 1 e 28
    
    const mes = (this.monthIndex + 1).toString().padStart(2, '0');
    return `${dia.toString().padStart(2, '0')}/${mes}`;
  }

async togglePagamento(info: any) {
  if (this.loading) return;
  
  const novoStatus = info.status === 'pago' ? 'pendente' : 'pago';
  
  if (novoStatus === 'pendente') {
    // Desmarcar pagamento - precisa de confirmação
    await this.confirmarAlteracaoStatus(info, novoStatus);
  } else {
    // Marcar como pago
    this.atualizarStatusPagamento(info, novoStatus);
  }
}

private async atualizarStatusPagamento(info: any, novoStatus: string) {
  this.loading = true;
  
  // Se já tem payment_id, use o endpoint de update
  if (info.payment_id) {
    this.subscription.add(
      this.paymentsService.atualizarStatusPagamento(info.payment_id, novoStatus).subscribe({
        next: (response: any) => {
          if (response.success) {
            // Atualizar o status localmente
            info.pago = novoStatus === 'pago';
            info.status = novoStatus;
            info.data_pagamento = response.data.data_pagamento_formatada || '';
            
            // Recarregar dados para atualizar estatísticas
            this.carregarDadosMensalidades();
            
            // Mostrar mensagem de sucesso
            this.mostrarMensagemSucesso(
              `Status alterado para: ${novoStatus === 'pago' ? 'Pago' : 'Pendente'}`
            );
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erro ao atualizar status do pagamento:', error);
          this.errorMessage = 'Erro ao atualizar status do pagamento';
          this.loading = false;
          this.cdr.markForCheck();
        }
      })
    );
  } else {
    // Se não tem payment_id, cria um novo pagamento
    this.subscription.add(
      this.paymentsService.registrarPagamento(
        info.user_id,
        this.mesReferenciaFormatado,
        novoStatus
      ).subscribe({
        next: (response) => {
          if (response.success) {
            // Atualizar o status localmente
            info.pago = novoStatus === 'pago';
            info.status = novoStatus;
            info.payment_id = response.data.id; // Guarda o ID do pagamento
            info.data_pagamento = response.data.data_pagamento_formatada || '';
            
            // Recarregar dados para atualizar estatísticas
            this.carregarDadosMensalidades();
            
            // Mostrar mensagem de sucesso
            this.mostrarMensagemSucesso(
              `Status alterado para: ${novoStatus === 'pago' ? 'Pago' : 'Pendente'}`
            );
          }
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Erro ao registrar pagamento:', error);
          this.errorMessage = 'Erro ao registrar pagamento';
          this.loading = false;
          this.cdr.markForCheck();
        }
      })
    );
  }
}

private async confirmarAlteracaoStatus(info: any, novoStatus: string) {
  const statusTexto = novoStatus === 'pago' ? 'Pago' : 'Pendente';
  
  const alert = await this.alertController.create({
    header: 'Confirmar alteração',
    message: `Tem certeza que deseja alterar o status de ${info.aluno} para ${statusTexto} em ${this.month}?`,
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
        cssClass: 'btn-cancel-mensalidades',
        handler: () => {
          console.log('Ação cancelada pelo usuário');
        }
      },
      {
        text: 'Confirmar',
        cssClass: 'btn-confirm-mensalidades',
        handler: () => {
          this.atualizarStatusPagamento(info, novoStatus);
          return true;
        }
      }
    ]
  });

  await alert.present();
}

  private async mostrarMensagemSucesso(mensagem: string) {
    const alert = await this.alertController.create({
      header: 'Sucesso',
      message: mensagem,
      buttons: ['OK']
    });

    await alert.present();
    
    // Fechar automaticamente após 2 segundos
    setTimeout(() => {
      alert.dismiss();
    }, 2000);
  }

  // Métodos de filtro e paginação (mantidos iguais)
  toggleFilter(event?: MouseEvent) {
    if (event) event.stopPropagation();
    this.showFilter = !this.showFilter;
  }

  selectFilter(option: typeof this.selectedFilter) {
    this.selectedFilter = this.selectedFilter === option ? '' : option;
    this.showFilter = false;
    this.onSearchChange();
  }

  clearFilter() {
    this.selectedFilter = '';
    this.searchTerm = '';
    this.showFilter = false;
    this.onSearchChange();
  }

  back() {
    this.router.navigate(['/students/finance/']);
  }

  get filteredInfos() {
    const term = this.searchTerm?.trim().toLowerCase() ?? '';
    return this.infos.filter(i => {
      const matchSearch = !term || (i.aluno && i.aluno.toLowerCase().includes(term));
      
      let matchFilter = true;
      if (this.selectedFilter === 'Pago') {
        matchFilter = i.pago === true;
      } else if (this.selectedFilter === 'Não pago') {
        matchFilter = i.pago === false;
      }
      
      return matchSearch && matchFilter;
    }).sort((a, b) => {
      if (this.selectedFilter === 'A-Z') return a.aluno.localeCompare(b.aluno);
      if (this.selectedFilter === 'Z-A') return b.aluno.localeCompare(a.aluno);
      return 0;
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredInfos.length / this.pageSize));
  }

  get pagedInfos() {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredInfos.slice(start, start + this.pageSize);
  }

  goToPage(page: number | '...') {
    if (page === '...') return;
    const target = Number(page);
    if (isNaN(target) || target < 1 || target > this.totalPages) return;
    if (this.currentPage === target) return;
    this.currentPage = target;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  nextPage() { this.goToPage(this.currentPage + 1); }
  prevPage() { this.goToPage(this.currentPage - 1); }

  get pageButtons(): Array<number | '...'> {
    const total = this.totalPages;
    const current = this.currentPage;
    const maxButtons = 5;
    
    if (total <= 7) {
      return Array.from({length: total}, (_, i) => i + 1);
    }

    const pages: Array<number | '...'> = [1];
    let left = Math.max(2, current - 1);
    let right = Math.min(total - 1, current + 1);

    if (current <= 3) {
      left = 2;
      right = 4;
    } else if (current >= total - 2) {
      left = total - 3;
      right = total - 1;
    }

    if (left > 2) pages.push('...');
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < total - 1) pages.push('...');
    pages.push(total);
    
    return pages;
  }

  onSearchChange() {
    this.currentPage = 1;
  }
}