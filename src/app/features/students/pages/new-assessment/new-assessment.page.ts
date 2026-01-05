import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, NavController } from '@ionic/angular';
import { AssessmentDraftService } from 'src/app/core/services/assessment-draft-service.service';
import { StudentsService } from 'src/app/core/services/StudentsService';

@Component({
  selector: 'app-new-assessment',
  templateUrl: './new-assessment.page.html',
  styleUrls: ['./new-assessment.page.scss'],
  standalone: false,
})
export class NewAssessmentPage implements OnInit {
  form!: FormGroup;
  studentId!: string | null;
  evaluationDate: Date = new Date(); // padrão hoje, você pode setar com valor vindo do servidor
  formSubmitted = false;
  @ViewChild(IonContent) ionContent!: IonContent;
  @ViewChild('formEl', { read: ElementRef }) formEl!: ElementRef;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private navCtrl: NavController,
    private studentsService: StudentsService,
    private AssessmentDraftService: AssessmentDraftService
  ) {}

  ngOnInit() {
    // pegar id da rota: /students/information/:id/physical-assessment/new
    this.studentId = this.route.snapshot.paramMap.get('id');

    this.form = this.fb.group({
      peso: ['', Validators.required],
      altura: ['', Validators.required],
      torax: ['', Validators.required],
      cintura: ['', Validators.required],
      abdome: ['', Validators.required],
      quadril: ['', Validators.required],
      braco_esq: ['', Validators.required],
      braco_dir: ['', Validators.required],
      antebraco_esq: ['', Validators.required],
      antebraco_dir: ['', Validators.required],
      coxa_esq: ['', Validators.required],
      coxa_dir: ['', Validators.required],
      panturrilha_esq: ['', Validators.required],
      panturrilha_dir: ['', Validators.required],
      subescapular: ['', Validators.required],
      triceps: ['', Validators.required],
      peitoral: ['', Validators.required],
      axilar: ['', Validators.required],
      suprailiaca: ['', Validators.required],
      abdominal: ['', Validators.required],
      femural: ['', Validators.required],
      objetivos: ['', Validators.required],
      evaluationDate: [this.evaluationDate],
    });

     // 1) aplicar draft (se existir)
  const draft = this.AssessmentDraftService.getDraftSnapshot();
  if (draft && Number(draft.studentId) === Number(this.studentId)) {
    this.applyDraftToForm(draft);
  }

  }

  private applyDraftToForm(draft: any) {
  // garante que evaluationDate seja Date no control
  const evalDate = draft.evaluationDate ? new Date(draft.evaluationDate) : this.evaluationDate;

  // patchValue mapeando chaves do draft para os nomes dos controls
  this.form.patchValue({
    peso: draft.peso ?? '',
    altura: draft.altura ?? '',
    torax: draft.torax ?? '',
    cintura: draft.cintura ?? '',
    abdome: draft.abdome ?? '',
    quadril: draft.quadril ?? '',
    braco_esq: draft.braco_esq ?? '',
    braco_dir: draft.braco_dir ?? '',
    antebraco_esq: draft.antebraco_esq ?? '',
    antebraco_dir: draft.antebraco_dir ?? '',
    coxa_esq: draft.coxa_esq ?? '',
    coxa_dir: draft.coxa_dir ?? '',
    panturrilha_esq: draft.panturrilha_esq ?? '',
    panturrilha_dir: draft.panturrilha_dir ?? '',
    subescapular: draft.subescapular ?? '',
    triceps: draft.triceps ?? '',
    peitoral: draft.peitoral ?? '',
    axilar: draft.axilar ?? '',
    suprailiaca: draft.suprailiaca ?? '',
    abdominal: draft.abdominal ?? '',
    femural: draft.femural ?? '',
    objetivos: draft.objetivos ?? '',
    evaluationDate: evalDate
  });

  // atualiza flags e seleção local quando necessário
  this.formSubmitted = false;
}

  cancel() {
    // volta para a listagem / detalhe do aluno
    if (this.studentId) {
      this.navCtrl.navigateBack(['/students/information', this.studentId]);
      return;
    }
    this.navCtrl.back();
  }

  private async scrollToFirstInvalid() {
    // espera um tick para garantir que os .ng-touched/.ng-invalid já foram aplicados
    await new Promise((r) => setTimeout(r, 50));

    // busca o primeiro elemento inválido dentro do form
    const formNative = this.formEl?.nativeElement as HTMLElement | undefined;
    const firstInvalid: HTMLElement | null = formNative
      ? formNative.querySelector('.ng-invalid')
      : document.querySelector('.ng-invalid');

    if (!firstInvalid) return;

    // tenta focar (se for input/select)
    try {
      (firstInvalid as HTMLElement).focus?.();
    } catch (e) {
      /* ignore */
    }

    // se tivermos IonContent, calculamos a posição relativa e usamos scrollToPoint
    if (this.ionContent) {
      try {
        const scrollEl = await this.ionContent.getScrollElement(); // HTMLElement
        const invalidRect = firstInvalid.getBoundingClientRect();
        const scrollRect = scrollEl.getBoundingClientRect();

        // posição relativa dentro do scrollEl
        const offsetTop = invalidRect.top - scrollRect.top + scrollEl.scrollTop;

        // ajusta um pouco para centralizar/mostrar label acima
        const y = Math.max(0, offsetTop - 200);

        // rola suavemente
        this.ionContent.scrollToPoint(0, Math.round(y), 300);
        return;
      } catch (err) {
        // fallback para scrollIntoView
      }
    }

    // fallback simples se IonContent falhar
    firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  hasError(controlPath: string, error: string = 'required'): boolean {
    const ctrl = this.form.get(controlPath);
    return !!(
      ctrl &&
      ctrl.hasError(error) &&
      (ctrl.touched || this.formSubmitted)
    );
  }

  saveAssessment() {
    this.formSubmitted = true;
    this.form.markAllAsTouched();

    if (!this.form.valid) {
      this.scrollToFirstInvalid();
      return;
    }

    const payload = {
      user_id: Number(this.studentId),
      evaluation_date: this.form.value.evaluationDate
        ? this.formatDate(this.form.value.evaluationDate)
        : this.formatDate(new Date()),
      // campos do formulário:
      weight: this.form.value.peso,
      height: this.form.value.altura,
      chest: this.form.value.torax,
      waist: this.form.value.cintura,
      abdomen: this.form.value.abdome,
      hip: this.form.value.quadril,
      arm_left: this.form.value.braco_esq,
      arm_right: this.form.value.braco_dir,
      forearm_left: this.form.value.antebraco_esq,
      forearm_right: this.form.value.antebraco_dir,
      thigh_left: this.form.value.coxa_esq,
      thigh_right: this.form.value.coxa_dir,
      calf_left: this.form.value.panturrilha_esq,
      calf_right: this.form.value.panturrilha_dir,
      subscapular: this.form.value.subescapular,
      triceps: this.form.value.triceps,
      chest_skinfold: this.form.value.peitoral,
      mid_axillary: this.form.value.axilar,
      suprailiac: this.form.value.suprailiaca,
      abdominal_skinfold: this.form.value.abdominal,
      femoral: this.form.value.femural,
      goals: this.form.value.objetivos,
    };
    this.AssessmentDraftService.setDraft(payload);
    this.navCtrl.navigateBack(['/students/information', this.studentId, 'assessment-result']);
  }

  private formatDate(d: string | Date) {
    const date = typeof d === 'string' ? new Date(d) : d;
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
