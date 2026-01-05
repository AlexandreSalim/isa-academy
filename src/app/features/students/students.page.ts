import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Student } from 'src/app/core/models/student.model';
import { StudentsService } from 'src/app/core/services/StudentsService';

@Component({
  selector: 'app-students',
  templateUrl: './students.page.html',
  styleUrls: ['./students.page.scss'],
  standalone: false,
})
export class StudentsPage implements OnInit {
  student?: Student;
  idParam?: number;

  students$!: Observable<Student[]>;
  loading = false;
  error = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private studentsService: StudentsService
  ) {}

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.idParam = id;

    if (this.idParam) {
      this.studentsService.getOne(this.idParam).subscribe({
        next: (value) => {
          this.student = value;
        },
        error: (err) => {
          this.error = 'Erro ao buscar aluno';
          console.error(err);
        },
      });
    } else {
      this.error = 'Id inválido';
    }
  }

  edit(id: number) {
    this.router.navigate(['/students/editar/' + id]);
  }

  avaliacao(id: number) {
    this.router.navigate([
      '/students/information/' + id + '/physical-assessment',
    ]);
  }

  training(id: number) {
    this.router.navigate(['/students/information/' + id + '/training']);
  }

  back() {
    this.router.navigate(['/students']); // ou history.back()
  }

  reload() {
    this.loading = true;
    this.error = '';
    this.studentsService.loadFromServer().subscribe({
      next: () => (this.loading = false),
      error: (err) => {
        this.loading = false;
        this.error = 'Erro ao carregar usuários';
        console.error(err);
      },
    });
  }
}
