import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';
import { Student } from '../models/student.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StudentsService {
  private api = environment.apiUrl + '/users/users.php'; // ajuste conforme sua rota
  private subj = new BehaviorSubject<Student[]>([]);

  constructor(private http: HttpClient) {
    // opcional: carregar já no construtor
    // this.loadFromServer();
  }

  // expõe Observable para o front usar (async pipe)
  getAll(): Observable<Student[]> {
    return this.subj.asObservable();
  }

  // snapshot síncrono
  getSnapshot(): Student[] {
    return this.subj.value;
  }

  // buscar por id no snapshot
  getById(id: number): Student | undefined {
    return this.getSnapshot().find((s) => s.id === Number(id));
  }

  // getOne: pega um usuário e retorna enriquecido
  getOne(id: number) {
    return this.http.get<any>(`${this.api}?id=${id}`).pipe(
      map((res) => {
        const raw =
          res && res.success !== undefined && res.data !== undefined
            ? res.data
            : res;
        return this.enrichStudent(raw);
      }),
      catchError((err) => {
        console.error('Erro getOne:', err);
        return throwError(() => err);
      })
    );
  }

  // loadFromServer: carrega a lista e enriquece cada aluno com age
  loadFromServer(): Observable<Student[]> {
    return this.http.get<any>(this.api).pipe(
      map((res) => {
        const raws: any[] =
          res && res.success !== undefined && res.data !== undefined
            ? res.data
            : (res as any[]);
        // garantir array
        const arr = Array.isArray(raws) ? raws : [];
        // manter tudo e só acrescentar age/date_of_birth convertida
        return arr.map((r) => this.enrichStudent(r));
      }),
      tap((students: Student[]) => this.subj.next(students)),
      catchError((err) => {
        console.error('Erro ao buscar usuários', err);
        return throwError(() => err);
      })
    );
  }

  // helper: calcula idade exata (considera dia/mês)
  private computeAge(dob: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  }

  // helper: tenta converter vários formatos para Date; se não der, retorna null
  private parseDate(value: any): Date | null {
    if (!value) return null;

    // se já for Date
    if (value instanceof Date && !isNaN(value.getTime())) return value;

    // se for número (timestamp em ms)
    if (typeof value === 'number') {
      const d = new Date(value);
      return isNaN(d.getTime()) ? null : d;
    }

    if (typeof value === 'string') {
      const s = value.trim();

      // 1) tratar explicitamente "YYYY-MM-DD" (ou "YYYY-MM-DD hh:mm:ss")
      //    evitando new Date('YYYY-MM-DD') que é interpretado como UTC
      const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (m) {
        const y = Number(m[1]);
        const mo = Number(m[2]) - 1; // monthIndex
        const d = Number(m[3]);
        const localDate = new Date(y, mo, d); // cria em timezone local — sem shift
        return isNaN(localDate.getTime()) ? null : localDate;
      }

      // 2) tentar ISO/other formats (ex: "2025-12-19T00:00:00Z" ou "26/06/2000")
      //    Date.parse pode funcionar para ISO com timezone; usamos como fallback.
      const ts = Date.parse(s);
      if (!isNaN(ts)) {
        const d2 = new Date(ts);
        return isNaN(d2.getTime()) ? null : d2;
      }
    }

    return null;
  }

  // mapeia preservando tudo e acrescentando date_of_birth (string "DD/MM/YYYY" | null) e age
  private enrichStudent(raw: any): Student {
    // clona tudo que veio do backend
    const studentObj: any = { ...(raw || {}) };

    // detectar possíveis campos alternativos
    const dobRaw =
      raw.date_of_birth ?? raw.dateOfBirth ?? raw.dob ?? raw.nascimento ?? null;
    const dobDate = this.parseDate(dobRaw);

    if (dobDate) {
      // definir date_of_birth como string formatada DD/MM/YYYY
      studentObj.date_of_birth = this.formatDateToDMY(dobDate);
      // também manter um campo interno opcional com Date se desejar (não sobrescreve o solicitado)
      studentObj._date_of_birth_obj = dobDate; // opcional — remova se não quiser
      studentObj.age = this.computeAge(dobDate);
    } else {
      // se o backend enviou algo que não parseou, tentar detectar formato YYYY-MM-DD simples
      if (typeof dobRaw === 'string') {
        // tenta extrair yyyy-mm-dd via regex e formatar
        const m = dobRaw.match(/^(\d{4})-(\d{2})-(\d{2})/);
        if (m) {
          const year = Number(m[1]);
          const month = Number(m[2]) - 1;
          const day = Number(m[3]);
          const tryDate = new Date(year, month, day);
          if (!isNaN(tryDate.getTime())) {
            studentObj.date_of_birth = this.formatDateToDMY(tryDate);
            studentObj._date_of_birth_obj = tryDate; // opcional
            studentObj.age = this.computeAge(tryDate);
            return studentObj as Student;
          }
        }
      }

      // fallback: mantemos o valor cru (string) se houver ou null
      studentObj.date_of_birth = dobRaw ?? null;
      studentObj.age = undefined;
    }

    return studentObj as Student;
  }

  // helper: formata Date -> "DD/MM/YYYY"
  private formatDateToDMY(d: Date): string {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = String(d.getFullYear());
    return `${day}/${month}/${year}`;
  }

  create(student: any) {
    return this.http.post<any>(
      `${environment.apiUrl}/users/create_user.php`,
      student
    );
  }

  update(id: number, student: any) {
    // envia o objeto com id junto ao payload
    const payload = { ...student, id };
    return this.http.post<any>(
      `${environment.apiUrl}/users/update_user.php`,
      payload
    );
  }

  ////////////assessment/////////////

  createAssessment(payload: any) {
    return this.http.post<any>(
      `${environment.apiUrl}/assessment/create_assessment.php`,
      payload
    );
  }

  // retorna array de avaliações do aluno
  getAssessments(user_id: number) {
    return this.http
      .get<any>(
        `${environment.apiUrl}/assessment/get_assessments.php?user_id=${user_id}`
      )
      .pipe(
        map((res) => {
          if (res && res.success !== undefined && res.data !== undefined)
            return res.data;
          return res;
        }),
        catchError((err) => {
          console.error('Erro ao buscar assessments', err);
          return throwError(() => err);
        })
      );
  }

  // retorna uma avaliação específica
  getAssessment(assessmentId: number) {
    return this.http
      .get<any>(
        `${environment.apiUrl}/assessment/get_assessment.php?id=${assessmentId}`
      )
      .pipe(
        map((res) => {
          if (res && res.success !== undefined && res.data !== undefined)
            return res.data;
          return res;
        }),
        catchError((err) => {
          console.error('Erro ao buscar assessment', err);
          return throwError(() => err);
        })
      );
  }

  //////////////////treino/////////////////

  //////pasta workout

  createWorkout(payload: {
    user_id: number;
    workout_date: string;
    general_notes?: string;
  }) {
    return this.http.post<any>(
      `${environment.apiUrl}/trainings/workouts
/create_workout.php`,
      payload
    );
  }

  getWorkout(user_id: number) {
    return this.http.get(`${environment.apiUrl}/trainings/workouts
/get_workout.php?user_id=${user_id}`);
  }

  ////////////////////////////

  ////////pasta muscle_groups

  createMuscleGroups(payload: any) {
    return this.http.post<any>(
      `${environment.apiUrl}/trainings/muscle_groups/create_muscle_groups.php`,
      payload
    );
  }

  getAllMuscleGroups() {
    return this.http.get<any>(
      `${environment.apiUrl}/trainings/muscle_groups/get_muscle_groups.php`
    );
  }

  getByIdMuscleGroups(id: number) {
    return this.http.get(
      `${environment.apiUrl}/trainings/muscle_groups/get_muscle_groups.php?id=${id}`
    );
  }

  ///////////////

  ///////////pasta exercises

  createExercises(payload: any) {
    return this.http.post<any>(
      `${environment.apiUrl}/trainings/exercises/create_exercises.php`,
      payload
    );
  }

  getExercisesByMuscleGroup(muscleGroupId: number) {
    return this.http.get<any>(
      `${environment.apiUrl}/trainings/exercises/get_exercises.php?muscle_group_id=${muscleGroupId}`
    );
  }

  getAllExercises() {
    return this.http.get<any>(
      `${environment.apiUrl}/trainings/exercises/get_exercises.php`
    );
  }
  ////////////////////

  /////////pasta workout_exercises
  createWorkoutExercise(payload: any) {
    return this.http.post<any>(
      `${environment.apiUrl}/trainings/workout_exercises/create_workout_exercise.php`,
      payload
    );
  }

  getWorkoutExercises(workoutId: number) {
    return this.http.get<any>(
      `${environment.apiUrl}/trainings/workout_exercises/get_workout_exercises.php?workout_id=${workoutId}`
    );
  }

  getWorkoutExerciseById(id: number) {
    return this.http.get<any>(
      `${environment.apiUrl}/trainings/workout_exercises/get_workout_exercises.php?id=${id}`
    );
  }

  deleteSerie(workoutId: number, serie: string) {
    return this.http.delete<any>(
      `${environment.apiUrl}/trainings/workout_exercises/delete_serie.php`,
      {
        params: {
          workout_id: workoutId.toString(),
          serie: serie,
        },
      }
    );
  }

deleteCompleteWorkout(workoutId: number) {
  return this.http.delete<any>(`${environment.apiUrl}/trainings/workout_exercises/delete_workout.php`, {
    params: { workout_id: workoutId.toString() } // CORREÇÃO AQUI: adicione o nome do parâmetro
  });
}

deleteWorkoutExercise(workoutExerciseId: number) {
  return this.http.delete<any>(
    `${environment.apiUrl}/trainings/workout_exercises/delete_workout_exercise.php?id=${workoutExerciseId}`
  );
}

updateWorkoutExercise(data: any) {
  return this.http.put<any>(
    `${environment.apiUrl}/trainings/workout_exercises/update_workout_exercise.php`,
    data
  );
}
  /////////////////////////

  createTrainings(payload: any) {
    return this.http.post<any>(
      `${environment.apiUrl}/trainings/create.php`,
      payload
    );
  }

  getTrainings(studentId: number) {
    return this.http.get<{ success: boolean; data: any }>(
      `${environment.apiUrl}/trainings/get.php?student_id=${studentId}`
    );
  }

  deleteTraining(studentId: number, trainingId: number) {
    const url = `${environment.apiUrl}/trainings/delete.php`;
    const payload = { student_id: studentId, id: trainingId };
    return this.http.post(url, payload);
  }

  updateTraining(payload: any) {
    const url = `${environment.apiUrl}/trainings/update.php`;
    return this.http.post(url, payload);
  }
}
