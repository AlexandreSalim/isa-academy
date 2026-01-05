import { Component, Inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogContent,
  MatDialogActions,
} from '@angular/material/dialog';
import { MuscleGroupsService } from '../../services/muscle-groups.service';
import { StudentsService } from 'src/app/core/services/StudentsService';
import { DialogDataMuscleGroups } from './muscle-groups-dialog/muscle-groups-dialog.component';
import { CommonModule } from '@angular/common';
import { AddExerciseService } from '../../services/add-exercise.service';
import { DialogDataExercise } from './add-exercise-dialog/add-exercise-dialog.component';

export interface DialogData {
  id?: number;
  workout_id: number;
  exercise_id: number;
  number_of_sets: number | null;
  weight: number | null;
  time: number;
  repetitions: number;
  serie: string | null;
  notes?: string | null;
  isEditMode?: boolean; // Nova propriedade para identificar modo
}

@Component({
  selector: 'app-exercicio-dialog',
  templateUrl: './exercicio-dialog.component.html',
  styleUrls: ['./exercicio-dialog.component.scss'],
  standalone: true,
  imports: [MatDialogActions, MatDialogContent, FormsModule, CommonModule],
})
export class ExercicioDialogComponent implements OnInit {
  muscleGroups: DialogDataMuscleGroups[] = [];
  exercises: DialogDataExercise[] = [];
  selectedMuscleGroupId: number | null = null;
  selectedExerciseId: number | null = null;
  isEditMode: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ExercicioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private MuscleGroupsService: MuscleGroupsService,
    private AddExerciseService: AddExerciseService,
    private studentsService: StudentsService
  ) {
    this.isEditMode = data.isEditMode || false;
  }

  ngOnInit(): void {
    this.loadMuscleGroups();
    this.loadAllExercises(); // Carregar todos os exercícios para edição
    
    // Se estiver em modo de edição e já tiver exercise_id, carregar os dados
    if (this.isEditMode && this.data.exercise_id) {
      this.setupEditMode();
    }
  }

  // No dialog component
get selectedMode(): 'repetitions' | 'time' {
  if (this.data.repetitions > 0) return 'repetitions';
  if (this.data.time > 0) return 'time';
  return 'repetitions'; // padrão
}

set selectedMode(value: 'repetitions' | 'time') {
  if (value === 'repetitions') {
    this.data.time = 0;
  } else {
    this.data.repetitions = 0;
  }
}

  setupEditMode(): void {
    // Encontrar o exercício na lista para obter o muscle_group_id
    const exercise = this.exercises.find(e => e.id === this.data.exercise_id);
    if (exercise) {
      this.selectedMuscleGroupId = exercise.muscle_group_id;
      this.selectedExerciseId = this.data.exercise_id;
      this.loadExercises(exercise.muscle_group_id);
    }
  }

  loadExercises(muscleGroupId: number): void {
    if (muscleGroupId > 0) {
      this.studentsService.getExercisesByMuscleGroup(muscleGroupId).subscribe({
        next: (res: any) => {
          this.exercises = res.data;
          // Se estiver em modo de edição, garantir que o exercício está selecionado
          if (this.isEditMode && this.data.exercise_id) {
            this.selectedExerciseId = this.data.exercise_id;
          }
        },
        error: (err) => {
          console.error('Erro ao carregar exercícios:', err);
        }
      });
    } else {
      this.exercises = [];
    }
  }

  loadAllExercises(): void {
    this.studentsService.getAllExercises().subscribe({
      next: (res: any) => {
        this.exercises = res.data;
        // Se estiver em modo de edição, configurar após carregar
        if (this.isEditMode && this.data.exercise_id) {
          this.setupEditMode();
        }
      },
      error: (err) => {
        console.error('Erro ao carregar todos os exercícios:', err);
      }
    });
  }

  loadMuscleGroups(): void {
    this.studentsService.getAllMuscleGroups().subscribe({
      next: (res: any) => {
        this.muscleGroups = res.data;
      },
      error: (err) => {
        console.error('Erro ao carregar grupos musculares:', err);
      }
    });
  }

  onMuscleGroupChange(event: any): void {
    const muscleGroupId = parseInt(event.target.value, 10);
    this.selectedMuscleGroupId = muscleGroupId;
    this.loadExercises(muscleGroupId);
    
    // Limpa o exercício selecionado quando muda o grupo
    if (!this.isEditMode) {
      this.selectedExerciseId = null;
      this.data.exercise_id = 0;
    }
  }

  onConfirm(): void {
    // Garante que o exercise_id esteja preenchido
    if (!this.selectedExerciseId || this.selectedExerciseId <= 0) {
      alert('Por favor, selecione um exercício');
      return;
    }
    
    // Atribui o exercise_id selecionado
    this.data.exercise_id = this.selectedExerciseId;
    
    // Verifica se o workout_id é válido (não necessário para edição)
    if (!this.isEditMode && (!this.data.workout_id || this.data.workout_id <= 0)) {
      console.error('Workout ID inválido no dialog:', this.data.workout_id);
      this.dialogRef.close(null);
      return;
    }
    
    // Fecha o dialog com os dados
    this.dialogRef.close(this.data);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  // Remova ou comente a função delete do dialog se não for usar aqui
  // deleteExercise(): void {
  //   if (confirm('Tem certeza que deseja excluir este exercício?')) {
  //     this.dialogRef.close({ action: 'delete', data: this.data });
  //   }
  // }

  openDialogExercises() {
    if (!this.selectedMuscleGroupId || this.selectedMuscleGroupId <= 0) {
      alert('Por favor, selecione um grupo muscular primeiro');
      return;
    }

    const initialData = {
      id: 0,
      name: '',
      muscle_group_id: this.selectedMuscleGroupId,
    };

    this.AddExerciseService.openAddExercicioDialog(initialData).subscribe((result: any) => {
      if (!result) return;

      const payload = {
        name: result.name,
        muscle_group_id: result.muscle_group_id
      };
      
      this.studentsService.createExercises(payload).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.loadExercises(this.selectedMuscleGroupId!);
            this.selectedExerciseId = res.id;
            this.data.exercise_id = res.id;
          }
        },
        error: (err) => console.error('Erro ao criar exercício:', err)
      });
    });
  }

  openDialogMuscleGroups() {
    const initialData = { id: 0, name: '' };

    this.MuscleGroupsService.openExercicioDialog(initialData).subscribe(
      (result: any) => {
        if (!result) return;

        const payload = { name: result.name };
        
        this.studentsService.createMuscleGroups(payload).subscribe({
          next: (res: any) => {
            if (res.success) {
              const newMuscleGroup = { id: res.id, name: result.name };
              this.muscleGroups.push(newMuscleGroup);
            }
          },
          error: (err) => console.error('Erro ao criar grupo muscular:', err)
        });
      }
    );
  }
}