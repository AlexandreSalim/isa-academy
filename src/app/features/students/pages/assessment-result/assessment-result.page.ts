import { Component, OnInit } from '@angular/core';
import { StudentsService } from 'src/app/core/services/StudentsService';
import { NavController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AssessmentDraftService } from 'src/app/core/services/assessment-draft-service.service';
import { take } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { computeBodyComposition } from '../../util/body-composition.util';

@Component({
  selector: 'app-assessment-result',
  templateUrl: './assessment-result.page.html',
  styleUrls: ['./assessment-result.page.scss'],
  standalone: false,
})
export class AssessmentResultPage implements OnInit {
  draft: any = null;
  saving = false;

  // valores mostrados no template
  imc = 0;
  imcLabel = '';
  weightRange = '';     // ex: '42kg e 56kg'
  density = '';         // ex.: '1.045 g/cm³' (string)
  fatPercent: number | null = null;
  fatLabel = '';
  leanMassKg = '';
  leanMassPct = '';

  // internal
  private studentFromApi: any = null;
  private draftSub!: Subscription;

  constructor(
    private draftService: AssessmentDraftService,
    private studentsService: StudentsService,
    private navCtrl: NavController,
    private router: Router
  ) {}

ngOnInit() {
    // subscreve ao draft$ para reagir a mudanças (quando voltar do form)
    this.draftSub = this.draftService.getDraft$().subscribe((d) => {
      this.draft = d;
      if (!this.draft) {
        // se não houver draft, volta ou limpa a tela
        // this.navCtrl.back();
        return;
      }
      const user_id = Number(this.draft?.user_id) || null;
      if (user_id) {
        // se ainda não temos o studentFromApi, busca; caso contrário, só popula
        if (!this.studentFromApi || this.studentFromApi?.id !== user_id) {
          this.studentsService.getOne(user_id).pipe(take(1)).subscribe({
            next: (s) => {
              this.studentFromApi = s;
              this.populateFromDraft();
            },
            error: () => {
              // se falhar, popula apenas com o draft mesmo
              this.populateFromDraft();
            }
          });
        } else {
          // já tem student carregado, apenas popula
          this.populateFromDraft();
        }
      } else {
        this.populateFromDraft();
      }
    });
  }

  ngOnDestroy() {
    this.draftSub?.unsubscribe();
  }

  // ---------- parsing helpers ----------
  private parseNumber(v: any): number | null {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(String(v).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }

  private parseHeightMeters(h: any): number | null {
    const n = this.parseNumber(h);
    if (n === null) return null;
    if (n > 3) return n / 100; // exemplo 175 -> 1.75
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

  // ---------- fórmulas ----------
  // Jackson & Pollock 7-site
  private densityFrom7Site(sum7: number, age: number, sex: 'M'|'F'): number {
    if (sex === 'M') {
      return 1.112 - 0.00043499 * sum7 + 0.00000055 * (sum7 * sum7) - 0.00028826 * age;
    } else {
      return 1.097 - 0.00046971 * sum7 + 0.00000056 * (sum7 * sum7) - 0.00012828 * age;
    }
  }

  // Jackson & Pollock 3-site (fallback)
  private densityFrom3Site(sum3: number, age: number, sex: 'M'|'F'): number {
    if (sex === 'M') {
      return 1.10938 - 0.0008267 * sum3 + 0.0000016 * (sum3 * sum3) - 0.0002574 * age;
    } else {
      return 1.0994921 - 0.0009929 * sum3 + 0.0000023 * (sum3 * sum3) - 0.0001392 * age;
    }
  }

  // Siri formula: %BF = (495 / density) - 450
  private fatFromDensity(density: number): number {
    if (!density || density <= 0) return NaN;
    return (495 / density) - 450;
  }

  // ---------- main population ----------
private populateFromDraft() {
  // usa o util centralizado (recebe draft e dados do student)
  const r = computeBodyComposition(this.draft ?? {}, this.studentFromApi);
  // IMC
  this.imc = r.imcVal ?? this.parseNumber(this.draft?.imcValue) ?? 0;
  this.imcLabel = this.getImcLabel(this.imc);

  // weight range
  if (r.altura) {
    const minIdeal = 18.5 * r.altura * r.altura;
    const maxIdeal = 24.9 * r.altura * r.altura;
    this.weightRange = `${Math.round(minIdeal)}kg e ${Math.round(maxIdeal)}kg`;
  } else {
    this.weightRange = this.draft?.weightRange ?? '—';
  }

  // density
  this.density = r.densidadeStr ?? (this.draft?.density ?? '—');

  // fatPercent
  this.fatPercent = r.fatPercentNum !== null ? +r.fatPercentNum.toFixed(2) : null;
  this.fatLabel = this.fatPercent !== null ? this.getFatLabel(this.fatPercent) : '';

  // lean mass (kg e %)
  if (r.leanKg !== null) {
    this.leanMassKg = `${r.leanKg.toFixed(1)} kg`;
    this.leanMassPct = r.leanPctStr;
  } else {
    this.leanMassKg = this.draft?.leanMassKg ?? '—';
    this.leanMassPct = this.draft?.leanMassPct ?? '—';
  }

  // garante formato final do imc
  this.imc = +(this.imc ? this.imc : 0);
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

  imcPositionPercent(): number {
    const min = 10, max = 40;
    const clamped = Math.max(min, Math.min(max, this.imc || 0));
    return ((clamped - min) / (max - min)) * 92 + 4;
  }

  imcBadgeClass(): string {
    if (this.imc < 18.5) return 'imc-underline--low';
    if (this.imc < 25) return 'imc-underline--normal';
    if (this.imc < 30) return 'imc-underline--over';
    return 'imc-underline--high';
  }

save() {
  if (!this.draft) return;

  // captura o id antes de limpar o draft
  const studentId = Number(this.draft.user_id);
  console.log(studentId, this.draft);
  this.saving = true;
  console.log(studentId, this.draft);
  this.studentsService.createAssessment(this.draft).subscribe({
    next: (res) => {
      console.log(studentId, this.draft);
      this.saving = false;

      // limpa draft **após** salvar (ou pode limpar antes se NÃO depender do draft para navegar)
      this.draftService.clear();

      // usa a cópia local do id (não this.draft, pois já foi limpo)
      if (studentId) {
        this.router.navigate(['/students/information', studentId]);
      } else {
        // fallback: só volta
        this.navCtrl.back();
      }
    },
    error: (err) => {
      this.saving = false;
      console.error('Erro ao salvar assessment', err);
      alert('Erro ao salvar avaliação');
    }
  });
}

  goBackToEdit() {
  if (!this.draft) return;
  const studentId = Number(this.draft.studentId);
  if (!studentId) return;
  // rota que abre o formulário (ajusta se sua rota for diferente)
  this.navCtrl.navigateForward(['/students/information', studentId, 'new-assessment']);
}
}
