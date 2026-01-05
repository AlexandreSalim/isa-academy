import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { Student } from 'src/app/core/models/student.model';
import { StudentsService } from 'src/app/core/services/StudentsService';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

@Component({
  selector: 'app-students-form',
  templateUrl: './students-form.page.html',
  styleUrls: ['./students-form.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonIcon,
    FormsModule,
    CommonModule,
    HeaderComponent,
    NgxMaskDirective,
    ReactiveFormsModule,
  ],
  providers: [provideNgxMask()],
})
export class StudentsForm implements OnInit {
  @ViewChild(IonContent) ionContent!: IonContent;
  @ViewChild('formEl', { read: ElementRef }) formEl!: ElementRef;

  form!: FormGroup;
  formSubmitted = false;

  // Configuração
  YEARS_BACK = 120;
  MIN_YEAR: number | null = null;
  MAX_YEAR: number | null = null;

  // Dados do select
  months = [
    'Jan',
    'Fev',
    'Mar',
    'Abr',
    'Mai',
    'Jun',
    'Jul',
    'Ago',
    'Set',
    'Out',
    'Nov',
    'Dez',
  ];
  years: number[] = [];
  days: number[] = [];

  // Seleção atual (mantém para uso lógico)
  selectedDay!: number;
  selectedMonth!: number; // 1-12
  selectedYear!: number;

  // edição
  isEdit = false;
  studentId: string | null = null;

  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly studentsService: StudentsService
  ) {}

  ngOnInit(): void {
    // inicializa form com todos os controls usados
    this.form = new FormGroup({
      name: new FormControl('', Validators.required),
      surname: new FormControl(''),
      day: new FormControl('', Validators.required),
      month: new FormControl('', Validators.required),
      year: new FormControl('', Validators.required),
      gender: new FormControl('', Validators.required),
      contact: new FormControl('', Validators.required),
    });

    // popula years/days
    this.populateYears();
    const today = new Date();
    this.selectedMonth = today.getMonth() + 1;
    this.selectedYear = today.getFullYear();
    this.populateDays();
    this.selectedDay = today.getDate();

    // seta valores iniciais nos controls day/month/year
    this.form.patchValue({
      day: this.selectedDay,
      month: this.selectedMonth,
      year: this.selectedYear,
    });

    this.studentId = this.route.snapshot.paramMap.get('id');
    if (this.studentId) {
      this.isEdit = true;
      this.loadStudent(this.studentId);
    }
  }

  private pad(n: number) {
    return n < 10 ? `0${n}` : `${n}`;
  }

  private populateYears(): void {
    const now = new Date();
    const currentYear = now.getFullYear();
    const maxY = Number.isInteger(this.MAX_YEAR)
      ? (this.MAX_YEAR as number)
      : currentYear;
    const minY = Number.isInteger(this.MIN_YEAR)
      ? (this.MIN_YEAR as number)
      : currentYear - this.YEARS_BACK;

    this.years = [];
    for (let y = maxY; y >= minY; y--) {
      this.years.push(y);
    }
  }

  private daysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
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

  /**
   * Tenta extrair day, month, year de vários formatos:
   * - Date object
   * - "DD/MM/YYYY"
   * - "YYYY-MM-DD" ou "YYYY-MM-DD hh:mm:ss"
   * - ISO (Date.parse)
   * Retorna { day, month, year } ou null se não conseguir.
   */
  private parseDobToParts(
    dob: any
  ): { day: number; month: number; year: number } | null {
    if (!dob && dob !== 0) return null;

    // 1) já é Date
    if (dob instanceof Date && !isNaN(dob.getTime())) {
      return {
        day: dob.getDate(),
        month: dob.getMonth() + 1,
        year: dob.getFullYear(),
      };
    }

    // 2) se veio com campo auxiliar _date_of_birth_obj (Date no service)
    if (typeof dob === 'object' && (dob as any).getFullYear) {
      const d = new Date(dob);
      if (!isNaN(d.getTime()))
        return {
          day: d.getDate(),
          month: d.getMonth() + 1,
          year: d.getFullYear(),
        };
    }

    if (typeof dob !== 'string') return null;
    const s = dob.trim();

    // 3) formato DD/MM/YYYY
    const rxDMY = /^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/;
    const m1 = s.match(rxDMY);
    if (m1) {
      const day = Number(m1[1]);
      const month = Number(m1[2]);
      const year = Number(m1[3]);
      if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        // valida dia conforme mês/ano
        const max = new Date(year, month, 0).getDate();
        if (day <= max) return { day, month, year };
      }
    }

    // 4) formato YYYY-MM-DD (ou com tempo)
    const rxYMD = /^(\d{4})-(\d{2})-(\d{2})/;
    const m2 = s.match(rxYMD);
    if (m2) {
      const year = Number(m2[1]);
      const month = Number(m2[2]);
      const day = Number(m2[3]);
      if (year > 1900 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        const max = new Date(year, month, 0).getDate();
        if (day <= max) return { day, month, year };
      }
    }

    // 5) tentar Date.parse para formatos ISO variados
    const ts = Date.parse(s);
    if (!isNaN(ts)) {
      const d = new Date(ts);
      return {
        day: d.getDate(),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      };
    }

    return null;
  }

  populateDays(): void {
    const year = Number(this.selectedYear) || new Date().getFullYear();
    const month = Number(this.selectedMonth) || 1;
    const maxDay = this.daysInMonth(year, month);

    const prev = this.selectedDay;
    this.days = [];
    for (let d = 1; d <= maxDay; d++) {
      this.days.push(d);
    }

    if (prev && prev <= maxDay) {
      this.selectedDay = prev;
    } else {
      this.selectedDay = Math.min(prev || 1, maxDay);
    }

    // se o dia atual ultrapassar maxDay, ajusta o control
    if (this.selectedDay > maxDay) {
      this.selectedDay = maxDay;
    }
    // atualiza o form control day
    this.form.get('day')?.setValue(this.selectedDay);
  }

  // handlers usados no template (sem ngModel)
  onDayChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedDay = Number(value);
    this.form.get('day')?.setValue(this.selectedDay);
  }

  onMonthChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedMonth = Number(value);
    this.form.get('month')?.setValue(this.selectedMonth);
  }

  onYearChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    this.selectedYear = Number(value);
    this.form.get('year')?.setValue(this.selectedYear);
  }

  // Retorna objeto com day/month/year
  getSelectedDOB() {
    return {
      day: Number(this.form.get('day')?.value),
      month: Number(this.form.get('month')?.value),
      year: Number(this.form.get('year')?.value),
    };
  }

  hasError(controlPath: string, error: string = 'required'): boolean {
    const ctrl = this.form.get(controlPath);
    return !!(
      ctrl &&
      ctrl.hasError(error) &&
      (ctrl.touched || this.formSubmitted)
    );
  }

  // Carrega aluno do backend e popula o form

  private loadStudent(idStr: string) {
    const id = Number(idStr);
    if (!id) return;

    this.studentsService.getOne(id).subscribe({
      next: (student: Student) => {
        // garantir que os selects estejam preenchidos corretamente a partir do date_of_birth
        const rawDobCandidates = [
          // prioriza campos comumente usados (ajuste conforme seu service)
          (student as any).date_of_birth ??
            (student as any).dateOfBirth ??
            (student as any).dateOfBirthString ??
            (student as any)._date_of_birth_obj ??
            null,
        ];

        let parts = null;
        for (const cand of rawDobCandidates) {
          parts = this.parseDobToParts(cand);
          if (parts) break;
        }

        // se não conseguiu parsear, tentar também o campo cru vindo do backend (por segurança)
        if (
          !parts &&
          (student as any).date_of_birth &&
          typeof (student as any).date_of_birth === 'string'
        ) {
          parts = this.parseDobToParts((student as any).date_of_birth);
        }

        // valores defaults (mantém o que já estava)
        let day = this.selectedDay,
          month = this.selectedMonth,
          year = this.selectedYear;

        if (parts) {
          year = parts.year;
          month = parts.month;
          day = parts.day;
        } else {
          // se não tem dob válido, você pode optar por deixar vazio ou manter a data atual
          // vou manter seletores com valores existentes (já inicializados)
        }

        // ajusta selects antes de dar patchValue
        this.selectedYear = year;
        this.selectedMonth = month;
        this.populateDays(); // popula days baseado em selectedMonth/Year
        // garante que day não excede o max do mês
        this.selectedDay = Math.min(day, this.days.length);

        this.form.patchValue({
          name: (student as any).name ?? '',
          surname: (student as any).surname ?? '',
          gender: (student as any).gender ?? '',
          contact: String((student as any).contact ?? ''),
          day: this.selectedDay,
          month: this.selectedMonth,
          year: this.selectedYear,
        });
      },
      error: (err) => {
        console.error('Erro ao carregar aluno (getOne):', err);
      },
    });
  }

  enviarForm() {
    this.formSubmitted = true;
    this.form.markAllAsTouched();

    const day = Number(this.form.get('day')?.value) || 1;
    const month = Number(this.form.get('month')?.value) || 1;
    const year =
      Number(this.form.get('year')?.value) || new Date().getFullYear();
    const dateOfBirth = `${year}-${this.pad(month)}-${this.pad(day)}`;

    const final = {
      name: this.form.value.name,
      surname: this.form.value.surname,
      gender: this.form.value.gender,
      contact: this.form.value.contact,
      dateOfBirth,
    };

    if (!this.form.valid) {
      this.scrollToFirstInvalid();
      return;
    }

    if (this.isEdit && this.studentId) {
      // chama update
      const idNum = Number(this.studentId);
      this.studentsService.update(idNum, final).subscribe({
        next: () => {
          this.studentsService.loadFromServer()?.subscribe?.({
            next: () => this.router.navigate(['/students']),
            error: () => this.router.navigate(['/students']),
          }) ?? this.router.navigate(['/students']);
        },
        error: () => {
          alert('Erro ao atualizar aluno');
        },
      });
    } else {
      // cria novo
      this.studentsService.create(final).subscribe({
        next: (res) => {
          this.studentsService.loadFromServer().subscribe({
            next: () => this.router.navigate(['/students']),
            error: () => this.router.navigate(['/students']),
          });
        },
        error: (err) => {
          alert('Erro ao cadastrar aluno');
        },
      });
    }
  }
}
