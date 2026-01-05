import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StudentsPage } from './students.page';
import { StudentsForm } from './pages/students-form';
import { StudentsList } from './pages/students-list.page';

const routes: Routes = [
  {
    path: '',
    component: StudentsList
  },
  {
    path: 'cadastrar',
    component: StudentsForm
  },
  {
    path: 'editar/:id',
    component: StudentsForm
  },
  {
    path: 'information/:id',
    component: StudentsPage
  },
  {
    path: 'information/:id/physical-assessment',
    loadChildren: () => import('./pages/physical-assessment/physical-assessment.module').then( m => m.PhysicalAssessmentPageModule)
  },
  {
    path: 'information/:id/new-assessment',
    loadChildren: () => import('./pages/new-assessment/new-assessment.module').then( m => m.NewAssessmentPageModule)
  },
  {
    path: 'information/:id/assessment-result',
    loadChildren: () => import('./pages/assessment-result/assessment-result.module').then( m => m.AssessmentResultPageModule)
  },
  {
    path: 'information/:id/training',
    loadChildren: () => import('./pages/training/training.module').then( m => m.TrainingPageModule)
  },  {
    path: 'finance',
    loadChildren: () => import('./pages/finance/finance.module').then( m => m.FinancePageModule)
  }




];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudentsPageRoutingModule {}
