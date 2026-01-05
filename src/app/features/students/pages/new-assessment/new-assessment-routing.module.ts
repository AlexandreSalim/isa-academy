import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NewAssessmentPage } from './new-assessment.page';

const routes: Routes = [
  {
    path: '',
    component: NewAssessmentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NewAssessmentPageRoutingModule {}
