import { Component, OnInit, HostListener, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonIcon } from '@ionic/angular/standalone';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { Router } from '@angular/router';
import { StudentsService } from 'src/app/core/services/StudentsService';
import { Student } from 'src/app/core/models/student.model';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-students-list',
  templateUrl: './students-list.page.html',
  styleUrls: ['./students-list.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonIcon,
    IonContent,
    IonTitle,
    IonToolbar,
    IonHeader,
    HeaderComponent,
  ]
})
export class StudentsList implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  searchTerm = '';
  showFilter = false;
  selectedFilter: '' | 'A-Z' | 'Z-A' | 'Masculino' | 'Feminino' | 'Em dia' | 'Em atraso' = '';

  alunos: Student[] = [];
  loading = false;
  error = '';

  constructor(
    private readonly router: Router,
    private readonly studentsService: StudentsService
  ) {}

  ngOnInit() {
    // 1) Assina o BehaviorSubject para atualizações reativas
    this.studentsService.getAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe(list => {
        // console.log(list);
        this.alunos = list || [];
      });

    // 2) Força recarregar do servidor (chamada HTTP)
    this.reloadFromServer();
  }

  // Recarrega do servidor (usado também pelo refresher)
  reloadFromServer() {
    this.loading = true;
    this.error = '';
    this.studentsService.loadFromServer()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loading = false;
          // a lista já foi atualizada via tap() no service
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Erro ao carregar usuários';
          console.error('Erro loadFromServer():', err);
        }
      });
  }

  back() {
    this.router.navigate(['/']);
  }

  toggleFilter(event?: MouseEvent) {
    if (event) {
      event.stopPropagation();
    }
    this.showFilter = !this.showFilter;
  }

  selectFilter(option: typeof this.selectedFilter) {
    this.selectedFilter = this.selectedFilter === option ? '' : option;
    this.showFilter = false;
  }

  clearFilter() {
    this.selectedFilter = '';
    this.searchTerm = '';
    this.showFilter = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    const target = ev.target as HTMLElement;
    if (!target.closest('.header_div2')) {
      this.showFilter = false;
    }
  }

  get filteredStudents(): Student[] {
    let list = [...this.alunos];
    const q = this.searchTerm?.trim().toLowerCase();
    if (q) {
      list = list.filter(s => s.name.toLowerCase().includes(q));
    }

    switch (this.selectedFilter) {
      case 'Masculino': list = list.filter(s => s.gender === 'Masculino'); break;
      case 'Feminino':  list = list.filter(s => s.gender === 'Feminino'); break;
      case 'Em dia':    list = list.filter(s => s.status === 'em dia'); break;
      case 'Em atraso': list = list.filter(s => s.status === 'em atraso'); break;
      case 'A-Z':       list = list.sort((a,b) => a.name.localeCompare(b.name)); break;
      case 'Z-A':       list = list.sort((a,b) => b.name.localeCompare(a.name)); break;
    }
    return list;
  }

  informationStudients(id: number) {
    this.router.navigate(['/students/information/', id]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
