import { Component, OnInit } from '@angular/core';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { DialogService } from 'src/app/core/services/dialog.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentsService } from 'src/app/core/services/StudentsService';
import { AddExercicioService } from './services/add-exercicio.service';
import { ConfirmDialogService } from './services/confirm-dialog.service';

import { finalize } from 'rxjs/operators';

interface Training {
  id?: number;
  workout_id: number;
  exercise_id: number;
  number_of_sets: number | null;
  time: number; // Em segundos
  repetitions: number;
  serie: string | null;
  notes?: string | null;
  weight?: number | null;
  exercise_name?: string;
}

@Component({
  selector: 'app-training',
  templateUrl: './training.page.html',
  styleUrls: ['./training.page.scss'],
  standalone: false,
})
export class TrainingPage implements OnInit {
  exercises: Training[] = []; // agora guarda só Training limpos
  trainingCompleted = false;
  trainingTrueDialog: string = '';

  currentWorkoutId: number = 0;
  creatingWorkout = false;

  series: string[] = ['A']; // Array com as séries disponíveis
  activeSerie: string = 'A'; // Série atualmente selecionada
  readonly allowedSeries = ['A', 'B', 'C'];

  // Propriedade para exercícios filtrados por série
  get filteredExercises(): Training[] {
    return this.exercises.filter((ex) => ex.serie === this.activeSerie);
  }

  // Propriedade para verificar se pode adicionar mais séries
  get canAddMoreSeries(): boolean {
    // Pode adicionar se tiver menos de 3 séries E houver letras disponíveis em A, B, C
    return this.series.length < this.allowedSeries.length;
  }

  constructor(
    private dialogService: DialogService,
    private confirmService: ConfirmDialogService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private studentsService: StudentsService,
    private addExercicioService: AddExercicioService
  ) {}

  ngOnInit() {
    const student_id = Number(this.activatedRoute.snapshot.paramMap.get('id'));

    if (!student_id || student_id <= 0) {
      console.warn('student_id inválido na rota:', student_id);
      return;
    }

    // Verificando se existe um workout
    this.studentsService.getWorkout(student_id).subscribe({
      next: (res: any) => {
        if (res.data && res.data.length > 0) {
          const latestWorkout = res.data[0];

          if (student_id === latestWorkout.user_id) {
            this.trainingCompleted = true;
            this.currentWorkoutId = latestWorkout.id;
            // Carrega os exercícios deste workout
            this.loadWorkoutExercises(this.currentWorkoutId);
          }
        } else {
          this.trainingCompleted = false;
          this.currentWorkoutId = 0; // Use 0 em vez de null
        }
      },
      error: (err) => {
        console.error('Erro ao buscar workouts:', err);
      },
    });
  }

  // Adicione este método para carregar exercícios do workout
  private loadWorkoutExercises(workoutId: number) {
    this.studentsService.getWorkoutExercises(workoutId).subscribe({
      next: (res: any) => {
        if (res && res.success && res.data) {
          this.exercises = res.data.map((exercise: any) => ({
            id: exercise.id,
            workout_id: exercise.workout_id,
            exercise_id: exercise.exercise_id,
            number_of_sets: exercise.number_of_sets,
            // Converte tempo de string para segundos
            time: exercise.time ? this.convertTimeToSeconds(exercise.time) : 0,
            repetitions: exercise.repetitions || 0,
            serie: exercise.serie || 'A',
            notes: exercise.notes,
            weight: exercise.weight,
            exercise_name: exercise.exercise_name || 'Exercício sem nome',
          }));
          // Extrair séries únicas dos exercícios
          this.extractUniqueSeries();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar exercícios do workout:', err);
      },
    });
  }
  // Método para extrair séries únicas dos exercícios
  private extractUniqueSeries() {
    // Filtra valores nulos/vazios e converte para string
    const uniqueSeries = new Set(
      this.exercises
        .map((ex) => ex.serie)
        .filter(
          (serie): serie is string =>
            serie !== null && serie !== undefined && serie.trim() !== ''
        )
        .map((serie) => serie.toUpperCase())
    );

    // Filtra apenas as séries permitidas e mantém na ordem A, B, C
    this.series = this.allowedSeries.filter((letter) =>
      uniqueSeries.has(letter)
    );

    // Se não houver séries, começa com 'A'
    if (this.series.length === 0) {
      this.series = ['A'];
    }

    // Garantir que activeSerie seja uma série válida
    if (!this.series.includes(this.activeSerie)) {
      this.activeSerie = this.series[0];
    }
  }

  // Método para adicionar nova série (limitado a 3)
  addNewSerie() {
    // Verifica se já tem 3 séries
    if (this.series.length >= 3) {
      alert('Você atingiu o limite máximo de 3 séries');
      return;
    }

    // Encontra a PRIMEIRA LETRA FALTANTE na ordem A, B, C
    let nextChar = '';

    for (const letter of this.allowedSeries) {
      if (!this.series.includes(letter)) {
        nextChar = letter;
        break;
      }
    }

    if (!nextChar) {
      alert('Todas as séries A, B e C já estão em uso');
      return;
    }

    // Adiciona a série na posição correta (ordenada)
    this.series.push(nextChar);
    this.series.sort(); // Garante a ordem A, B, C

    // Seleciona a nova série
    this.activeSerie = nextChar;
  }

  // Método para selecionar série
  selectSerie(serie: string) {
    this.activeSerie = serie;
  }

  // Handler do CDK para reordenar o array
  drop(event: CdkDragDrop<any[]>) {
    if (event.previousIndex === event.currentIndex) return;
    moveItemInArray(this.exercises, event.previousIndex, event.currentIndex);
    // Aqui você pode salvar a nova ordem no backend, se necessário
  }

  openDialog() {
    this.dialogService
      .chooseOption({
        title: 'Criar novo treino',
        options: [
          { label: 'Criar novo treino', value: 'create', checked: true },
          { label: 'Resgatar treino da biblioteca', value: 'rescue' },
        ],
        confirmText: 'Criar',
        cancelText: 'Cancelar',
      })
      .subscribe((result) => {
        if (!result || !result.confirmed || !result.selectedOption) return;

        if (result.selectedOption === 'create') {
          // cria o workout no backend e guarda o id retornado
          const student_id = Number(
            this.activatedRoute.snapshot.paramMap.get('id')
          );
          if (!student_id || student_id <= 0) {
            console.error('student_id inválido na rota:', student_id);
            return;
          }

          const payload = {
            user_id: student_id,
            workout_date: new Date().toISOString().slice(0, 10), // hoje YYYY-MM-DD
            general_notes: '',
          };

          this.creatingWorkout = true;
          this.trainingTrueDialog = 'Criando treino...';

          // No openDialog(), após criar o workout:
          this.studentsService
            .createWorkout(payload)
            .pipe(
              finalize(() => {
                this.creatingWorkout = false;
                this.trainingTrueDialog = '';
              })
            )
            .subscribe({
              next: (res: any) => {
                if (res && res.success && res.id) {
                  this.currentWorkoutId = Number(res.id);
                  this.trainingCompleted = true;

                  // Aguarda um pouco e abre o dialog para adicionar exercício
                  setTimeout(() => {
                    this.openDialogExercicio();
                  }, 100); // Pequeno delay para garantir que o ID foi armazenado
                } else {
                  console.error('Resposta inesperada ao criar workout:', res);
                  alert('Erro ao criar treino. Tente novamente.');
                }
              },
              error: (err) => {
                console.error('Erro ao criar workout:', err);
                alert('Erro ao criar treino. Tente novamente.');
              },
            });
        }
      });
  }

  // Método para deletar o treino completo (todas as séries)
  deleteCompleteWorkout() {
    if (!this.currentWorkoutId || this.currentWorkoutId <= 0) {
      console.warn('Nenhum workout ativo para deletar');
      alert('Nenhum treino ativo para excluir');
      return;
    }

    // Contar total de exercícios
    const totalExercises = this.exercises.length;

    this.confirmService
      .confirm({
        title: 'Excluir treino completo',
        message: `
        <div style="text-align: center; margin-bottom: 1rem;">
          <ion-icon name="warning" style="font-size: 3rem; color: #ff5722;"></ion-icon>
        </div>
        <p>Tem certeza que deseja excluir <strong>todo o treino</strong>?</p>
        <p><strong>Esta ação não pode ser desfeita!</strong></p>
        <div style="background: #f8f8f8; padding: 0.75rem; border-radius: 4px; margin: 1rem 0;">
          <p style="margin: 0; font-size: 0.9rem;">
            📋 <strong>Resumo do que será excluído:</strong><br>
            • ${this.series.length} séries (${this.series.join(', ')})<br>
            • ${totalExercises} exercícios no total
          </p>
        </div>
      `,
        confirmText: 'Excluir Tudo',
        cancelText: 'Cancelar',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        const studentId = Number(
          this.activatedRoute.snapshot.paramMap.get('id')
        );
        if (!studentId) {
          console.error('studentId inválido na rota');
          return;
        }

        // Salvar estado atual para possível rollback
        const prevExercises = [...this.exercises];
        const prevSeries = [...this.series];
        const prevActiveSerie = this.activeSerie;
        const prevTrainingCompleted = this.trainingCompleted;
        const prevWorkoutId = this.currentWorkoutId;

        // Otimista: limpa tudo localmente
        this.exercises = [];
        this.series = ['A'];
        this.activeSerie = 'A';
        this.trainingCompleted = false;
        this.trainingTrueDialog = 'Excluindo treino completo...';

        // Chama o backend para deletar o workout completo
        this.studentsService
          .deleteCompleteWorkout(this.currentWorkoutId)
          .subscribe({
            next: (res: any) => {
              this.trainingTrueDialog = '';

              if (!res || !res.success) {
                // Rollback em caso de erro
                this.exercises = prevExercises;
                this.series = prevSeries;
                this.activeSerie = prevActiveSerie;
                this.trainingCompleted = prevTrainingCompleted;
                this.currentWorkoutId = prevWorkoutId;

                alert(
                  `Erro ao excluir treino: ${res?.error || 'Erro desconhecido'}`
                );
              } else {
                // Sucesso: limpa o workoutId atual
                this.currentWorkoutId = 0;

                // Feedback para o usuário
                this.showDeleteSuccessMessage(totalExercises);

                // Opcional: navegar de volta para a lista de alunos
                // setTimeout(() => {
                //   this.router.navigate(['/students']);
                // }, 2000);
              }
            },
            error: (err) => {
              this.trainingTrueDialog = '';

              // Rollback em caso de erro
              this.exercises = prevExercises;
              this.series = prevSeries;
              this.activeSerie = prevActiveSerie;
              this.trainingCompleted = prevTrainingCompleted;
              this.currentWorkoutId = prevWorkoutId;

              console.error('Erro ao excluir treino completo:', err);
              alert('Erro ao excluir treino. Tente novamente.');
            },
          });
      });
  }

// Método auxiliar para mostrar mensagem de sucesso
private showDeleteSuccessMessage(totalExercises: number) {
  const message = `✅ Treino excluído com sucesso! (${totalExercises} exercícios removidos)`;
  
  // Opção 1: Usar o DialogService.showToast se disponível
  if (this.dialogService && typeof this.dialogService.showToast === 'function') {
    this.dialogService.showToast(message, 3000);
  } 
  // Opção 2: Usar o serviço de toasts do Ionic se estiver usando
  else if (typeof (window as any).toastController !== 'undefined') {
    // Se estiver usando Ionic toastController
    this.showIonicToast(message);
  }
  // Opção 3: Alert simples (fallback)
  else {
    alert(message);
  }
}

// Método para toast do Ionic (se estiver usando Ionic)
private async showIonicToast(message: string) {
  const toast = document.createElement('ion-toast');
  toast.message = message;
  toast.duration = 3000;
  toast.color = 'success';
  toast.position = 'bottom';
  
  document.body.appendChild(toast);
  await toast.present();
  
  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 3000);
}
  // Método para deletar uma série (do banco de dados)
  deleteSerieCompleta(serie: string, event?: Event) {
    if (event) event.stopPropagation();

    this.confirmService
      .confirm({
        title: 'Excluir série',
        message: `Tem certeza que deseja excluir completamente a Série <strong>${serie}</strong>? Todos os exercícios desta série serão removidos permanentemente.`,
        confirmText: 'Excluir Tudo',
        cancelText: 'Cancelar',
        destructive: true,
      })
      .subscribe((confirmed) => {
        if (!confirmed) return;

        // Chama o backend para deletar a série
        this.studentsService
          .deleteSerie(this.currentWorkoutId, serie)
          .subscribe({
            next: (res: any) => {
              if (res && res.success) {
                // Remove os exercícios da série do array local
                this.exercises = this.exercises.filter(
                  (ex) => ex.serie !== serie
                );

                // Remove a série do array de séries
                const index = this.series.indexOf(serie);
                if (index > -1) {
                  this.series.splice(index, 1);
                }

                // REORDENA as séries para manter A, B, C
                this.series.sort();

                // Seleciona outra série
                if (this.activeSerie === serie) {
                  this.activeSerie =
                    this.series.length > 0 ? this.series[0] : 'A';
                }
              } else {
                alert(
                  `Erro ao excluir série: ${res?.error || 'Erro desconhecido'}`
                );
              }
            },
            error: (err) => {
              console.error('Erro ao excluir série:', err);
              alert('Erro ao excluir série. Tente novamente.');
            },
          });
      });
  }

deleteWorkoutExercise(workoutExercise: any, index: number) {
  if (!workoutExercise || typeof workoutExercise.id !== 'number') {
    console.warn('Exercício inválido ou sem id:', workoutExercise);
    return;
  }

  // Abrir o confirm bonito
  this.confirmService
    .confirm({
      title: 'Excluir exercício',
      message: `Tem certeza que deseja excluir o exercício "<strong>${workoutExercise.exercise_name}</strong>" do treino? Esta ação não pode ser desfeita.`,
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      destructive: true,
    })
    .subscribe((confirmed) => {
      if (!confirmed) return;

      // Salvar estado anterior para rollback
      const prevExercises = this.exercises.map((e) => ({ ...e }));

      // Optimistic UI - remover da lista imediatamente
      this.exercises.splice(index, 1);
      this.trainingTrueDialog = 'Excluindo exercício...';

      this.studentsService
        .deleteWorkoutExercise(workoutExercise.id)  // Passa o ID do workout_exercise
        .subscribe({
          next: (res: any) => {
            this.trainingTrueDialog = '';
            if (!res || !res.success) {
              // Rollback se falhar
              this.exercises = prevExercises;
              alert('Não foi possível excluir o exercício no servidor.');
            } else {
              // Sucesso
              this.showSuccessMessage(`Exercício "${workoutExercise.exercise_name}" removido com sucesso!`);
              
              // Opcional: atualizar dados do servidor se necessário
              // this.loadExercises();
            }
          },
          error: (err) => {
            this.trainingTrueDialog = '';
            this.exercises = prevExercises; // Rollback
            console.error('Erro ao excluir exercício:', err);
            alert('Erro ao excluir exercício. Tente novamente.');
          },
        });
    });
}

// Função auxiliar para mostrar mensagem de sucesso
showSuccessMessage(message: string) {
  // Use seu sistema de notificação preferido
  // Exemplo com alert simples:
  // alert(message);
  
  // Ou com um snackbar/toast:
  // this.snackBar.open(message, 'Fechar', { duration: 3000 });
}

// No seu componente principal (onde está a lista de exercícios)
editWorkoutExercise(exercise: any, index: number) {
  // Preparar dados para o dialog
  const dialogData = {
    id: exercise.id, // IMPORTANTE: ID do workout_exercise
    workout_id: exercise.workout_id,
    exercise_id: exercise.exercise_id,
    number_of_sets: exercise.number_of_sets,
    weight: exercise.weight,
    time: exercise.time, // Já deve estar em segundos
    repetitions: exercise.repetitions,
    serie: exercise.serie,
    notes: exercise.notes,
    isEditMode: true // Marcar como modo de edição
  };

  this.addExercicioService
    .openExercicioDialog(dialogData, true) // true = modo edição
    .subscribe((result: any) => {
      if (!result) {
        return; // Usuário cancelou
      }

      // Montar payload para atualização
      const payload = {
        id: exercise.id, // ID do workout_exercise
        exercise_id: Number(result.exercise_id),
        serie: result.serie && result.serie !== '' ? String(result.serie) : null,
        number_of_sets: result.number_of_sets ? Number(result.number_of_sets) : null,
        repetitions: result.repetitions,
        time: result.time,
        notes: result.notes ? String(result.notes) : null,
        weight: result.weight ? Number(result.weight) : null,
      };

      // Salvar estado anterior para rollback
      const prevExercise = { ...this.exercises[index] };
      
      // Optimistic UI - atualizar localmente
      this.exercises[index] = { 
        ...this.exercises[index], 
        ...payload,
        exercise_name: this.exercises[index].exercise_name // Manter o nome
      };

      this.trainingTrueDialog = 'Atualizando exercício...';

      // Chamar serviço de atualização
      this.studentsService.updateWorkoutExercise(payload).subscribe({
        next: (res: any) => {
          this.trainingTrueDialog = '';
          
          if (!res || !res.success) {
            // Rollback se falhar
            this.exercises[index] = prevExercise;
            alert('Não foi possível atualizar o exercício no servidor.');
          } else {
            // Sucesso - atualizar com dados completos do servidor
            if (res.data) {
              this.exercises[index] = {
                ...this.exercises[index],
                ...res.data,
                exercise_name: res.data.exercise_name || this.exercises[index].exercise_name
              };
            }
            
            // Feedback para o usuário
            this.showSuccessMessage(`Exercício "${res.data?.exercise_name || 'atualizado'}" modificado com sucesso!`);
          }
        },
        error: (err) => {
          this.trainingTrueDialog = '';
          this.exercises[index] = prevExercise; // Rollback
          console.error('Erro ao atualizar exercício:', err);
          alert('Erro ao atualizar exercício. Tente novamente.');
        }
      });
    });
}

  openDialogExercicio() {
    // Verifica se temos um workout_id válido
    if (!this.currentWorkoutId || this.currentWorkoutId <= 0) {
      console.error('É necessário criar um workout primeiro');
      alert('Crie um workout antes de adicionar exercícios');
      return;
    }

    const initialData = {
      id: 0,
      workout_id: this.currentWorkoutId, // Passe o workout_id correto aqui!
      exercise_id: 0,
      number_of_sets: null,
      time: 0,
      repetitions: 0,
      serie: this.activeSerie,
      notes: null,
      mode: 'repeticao',
    };

    this.addExercicioService
      .openExercicioDialog(initialData)
      .subscribe((result: any) => {
        if (!result) {
          return;
        }

        // VALIDAÇÃO: Verifica se o exercício foi selecionado
        if (!result.exercise_id || result.exercise_id <= 0) {
          alert('Por favor, selecione um exercício');
          return;
        }

        // Montar payload com tipos corretos
        const payload = {
          workout_id: Number(result.workout_id), // Deve ser o mesmo workout_id que criamos
          exercise_id: Number(result.exercise_id),
          serie:
            result.serie !== undefined &&
            result.serie !== null &&
            result.serie !== ''
              ? String(result.serie) // serie é string
              : null,
          number_of_sets:
            result.number_of_sets !== undefined &&
            result.number_of_sets !== null &&
            result.number_of_sets !== ''
              ? Number(result.number_of_sets)
              : null,
          repetitions:
            result.repetitions !== undefined && result.repetitions !== null
              ? Number(result.repetitions)
              : null,
          time:
            result.time !== undefined && result.time !== null && result.time > 0
              ? this.formatTime(Number(result.time)) // Formata para "HH:MM:SS"
              : null,
          notes: result.notes ? String(result.notes) : null,
          weight: result.weight, // ou adicione se tiver no dialog
        };

        // Valida se pelo menos um campo de treino está preenchido
        if (
          !payload.number_of_sets &&
          !payload.repetitions &&
          !payload.time &&
          !payload.serie
        ) {
          alert(
            'Informe pelo menos um campo de treino (séries, repetições, tempo ou série)'
          );
          return;
        }

        this.studentsService.createWorkoutExercise(payload).subscribe({
          next: (res: any) => {
            if (res && res.success) {
              // criar o objeto Training limpo (mesmo formato usado no get)
              const newTraining: Training = {
                id: res.id, // ID do workout_exercise criado
                workout_id: payload.workout_id,
                exercise_id: payload.exercise_id,
                number_of_sets: payload.number_of_sets,
                time: result.time || 0, // Mantém como número se for segundos
                repetitions: payload.repetitions || 0,
                serie: payload.serie,
                notes: payload.notes,
                weight: payload.weight,
                exercise_name: res.data?.exercise_name || 'Novo Exercício',
              };

              // adiciona ao array (limpo)
              this.exercises.push(newTraining);

              // Feedback para o usuário
            } else {
              console.warn(
                'API retornou success=false ou formato inesperado',
                res
              );
              alert(`Erro: ${res?.error || 'Falha ao adicionar exercício'}`);
            }
          },
          error: (err) => {
            console.error('Erro ao salvar treino', err);
            alert(
              `Erro: ${
                err.error?.error || 'Falha na comunicação com o servidor'
              }`
            );
          },
        });
      });
  }

  // Função para formatar segundos em string HH:MM:SS (apenas se o backend esperar string)
  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  private convertTimeToSeconds(timeString: string): number {
    if (!timeString) return 0;

    const parts = timeString.split(':');
    if (parts.length === 3) {
      const hours = parseInt(parts[0]) || 0;
      const minutes = parseInt(parts[1]) || 0;
      const seconds = parseInt(parts[2]) || 0;
      return hours * 3600 + minutes * 60 + seconds;
    }
    return 0;
  }
}
