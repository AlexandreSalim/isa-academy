import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AssessmentResultPage } from './assessment-result.page';

const routes: Routes = [
  {
    path: '',
    component: AssessmentResultPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AssessmentResultPageRoutingModule {}
