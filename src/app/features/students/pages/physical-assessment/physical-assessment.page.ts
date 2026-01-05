import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Student } from 'src/app/core/models/student.model';
import { StudentsService } from 'src/app/core/services/StudentsService';
import { computeBodyComposition } from '../../util/body-composition.util';
declare const Swiper: any;

@Component({
  selector: 'app-physical-assessment',
  templateUrl: './physical-assessment.page.html',
  styleUrls: ['./physical-assessment.page.scss'],
  standalone: false,
})
export class PhysicalAssessmentPage implements OnInit, OnDestroy {
  student?: Student;
  idParam?: number;
  assessments: any[] = [];
  loading = false;
  error = '';

  // Propriedades para controlar a exibição
  showAllAssessments = true; // Controla se mostra todas as avaliações
  visibleAssessments: any[] = []; // Avaliações atualmente visíveis
  itemsPerPage = 3; // Quantas avaliações mostrar por vez

  private destroy$ = new Subject<void>();
  private swiperInstance: any;
  private swiperInitAttempts = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentsService: StudentsService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || id <= 0) {
      this.error = 'ID do aluno inválido';
      console.error(
        this.error,
        'param:',
        this.route.snapshot.paramMap.get('id')
      );
      return;
    }
    this.idParam = id;

    // buscar dados do aluno (getOne ou fallback)
    if (typeof this.studentsService.getOne === 'function') {
      this.studentsService
        .getOne(this.idParam)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (s) => (this.student = s),
          error: (err) => {
            console.error('Erro ao buscar aluno', err);
            this.student = this.studentsService.getById(this.idParam!);
          },
        });
    } else {
      this.student = this.studentsService.getById(this.idParam);
    }

    // carregar avaliações
    this.loadAssessments();
  }

    // Verifica se há mais avaliações para mostrar
  get hasMoreAssessments(): boolean {
    return this.assessments.length > 1;
  }

  // Conta quantas avaliações adicionais existem
  get additionalAssessmentsCount(): number {
    return Math.max(0, this.assessments.length - 1); 
  }

  // Retorna apenas as avaliações "antigas" (excluindo a primeira)
  get olderAssessments(): any[] {
    return this.assessments.slice(1);
  }

  /***********************
   * helpers & fórmulas
   ***********************/
  private parseNumber(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  private parseHeightMeters(h: any): number | null {
    const n = this.parseNumber(h);
    if (n === null) return null;
    if (n > 3) return n / 100; // 175 -> 1.75
    return n; // já em metros
  }

  private computeAgeFromDob(dobStr?: string): number | null {
    if (!dobStr) return null;
    const d = new Date(dobStr);
    if (isNaN(d.getTime())) return null;
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  // Jackson & Pollock 7-site
  private densityFrom7Site(sum7: number, age: number, sex: 'M' | 'F'): number {
    if (sex === 'M') {
      return (
        1.112 -
        0.00043499 * sum7 +
        0.00000055 * (sum7 * sum7) -
        0.00028826 * age
      );
    } else {
      return (
        1.097 -
        0.00046971 * sum7 +
        0.00000056 * (sum7 * sum7) -
        0.00012828 * age
      );
    }
  }

  // Jackson & Pollock 3-site
  private densityFrom3Site(sum3: number, age: number, sex: 'M' | 'F'): number {
    if (sex === 'M') {
      return (
        1.10938 - 0.0008267 * sum3 + 0.0000016 * (sum3 * sum3) - 0.0002574 * age
      );
    } else {
      return (
        1.0994921 -
        0.0009929 * sum3 +
        0.0000023 * (sum3 * sum3) -
        0.0001392 * age
      );
    }
  }

  // Siri formula: %BF = (495 / density) - 450
  private fatFromDensity(density: number): number {
    if (!density || density <= 0) return NaN;
    return 495 / density - 450;
  }

  private getImcLabel(imc: number): string {
    if (!imc || imc === 0) return '';
    if (imc < 18.5) return 'Magreza';
    if (imc < 25) return 'Normal';
    if (imc < 30) return 'Sobrepeso';
    return 'Obeso';
  }

  private getFatLabel(p: number): string {
    if (p === null || p === undefined) return '';
    if (p < 10) return 'baixo';
    if (p < 20) return 'normal';
    if (p < 25) return 'elevado';
    return 'alto';
  }

  /***********************
   * compute per assessment
   ***********************/
  private computeMetricsForAssessment(a: any) {
    const r = computeBodyComposition(a ?? {}, this.student);

    a.imc = r.imcVal !== null ? +r.imcVal.toFixed(1) : a.imc ?? '—';
    a.imcLabel =
      r.imcVal !== null ? this.getImcLabel(r.imcVal) : a.imcLabel ?? '';

    a.weightRange = r.altura
      ? `${Math.round(18.5 * r.altura * r.altura)}kg e ${Math.round(
          24.9 * r.altura * r.altura
        )}kg`
      : a.weightRange ?? '—';

    a.densidade = r.densidadeStr;
    a.percentual_gordura = r.fatPercentStr;
    a.percentual_gordura_num = r.fatPercentNum;

    a.massa_magra =
      r.leanKg !== null ? `${r.leanKg.toFixed(1)} kg` : a.massa_magra ?? '—';
    a.massa_gorda =
      r.fatKg !== null ? `${r.fatKg.toFixed(1)} kg` : a.massa_gorda ?? '—';

    a.fatLabel =
      r.fatPercentNum !== null
        ? this.getFatLabel(r.fatPercentNum)
        : a.fatLabel ?? '';
  }

  /***********************
   * load assessments
   ***********************/
  loadAssessments() {
    if (!this.idParam) return;
    this.loading = true;
    this.error = '';
    this.studentsService
      .getAssessments(this.idParam)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (rows) => {
          this.assessments = (rows || []).map((r: any) => ({ ...r })); // clone defensivo
          // calcula métricas para cada assessment
          this.assessments.forEach((a) => {
            try {
              this.computeMetricsForAssessment(a);
            } catch (e) {
              console.error('Erro ao computar métricas para assessment', a, e);
            }
          });

          console.log(
            '[PhysicalAssessment] assessments after compute ->',
            this.assessments
          );
          this.loading = false;
          this.updateVisibleAssessments();
          // inicializa o swiper apenas depois de os slides terem sido renderizados
          setTimeout(() => this.initSwiperWithRetry(), 50);
        },
        error: (err) => {
          console.error('Erro ao carregar avaliações', err);
          this.error = 'Erro ao carregar avaliações';
          this.loading = false;
        },
      });
  }

  /***********************
   * Métodos para controlar exibição das avaliações
   ***********************/

  // Método para alternar entre mostrar todas ou apenas algumas avaliações
  toggleOtherAssessments() {
    this.showAllAssessments = !this.showAllAssessments;
    this.updateVisibleAssessments();
  }

  // Atualiza quais avaliações estão visíveis
  private updateVisibleAssessments() {
    if (this.showAllAssessments) {
      // Mostra todas as avaliações
      this.visibleAssessments = [...this.assessments];
    } else {
      // Mostra apenas a primeira avaliação (ou as primeiras X)
      this.visibleAssessments = this.assessments.slice(0, 1);
    }
  }

  private initSwiperWithRetry() {
    // se já temos instância, apenas atualiza
    if (this.swiperInstance) {
      try {
        this.swiperInstance.update();
      } catch (e) {}
      return;
    }

    // Se Swiper script ainda não foi carregado (CDN), faz tentativas curtas
    if (typeof Swiper === 'undefined') {
      if (this.swiperInitAttempts > 8) return; // evita loop infinito
      this.swiperInitAttempts++;
      setTimeout(() => this.initSwiperWithRetry(), 200);
      return;
    }

    // cria a instância
    this.swiperInstance = new Swiper('.mySwiper', {
      slidesPerView: 1.05,
      spaceBetween: 14,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      breakpoints: {
        640: { slidesPerView: 1.2 },
        768: { slidesPerView: 2 },
        1024: { slidesPerView: 3 },
      },
    });
  }

  // Adicione este método à classe
  switchToTab(assessment: any, tabName: string) {
    assessment.activeTab = tabName;
  }

  viewAssessment(assessmentId: number) {
    this.router.navigate([
      '/students/information',
      this.idParam,
      'physical-assessment',
      assessmentId,
    ]);
  }

  newAssessment() {
    this.router.navigate([
      '/students/information',
      this.idParam,
      'physical-assessment',
      'new',
    ]);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.swiperInstance) {
      try {
        this.swiperInstance.destroy(true, true);
      } catch (e) {}
      this.swiperInstance = null;
    }
  }
}
