import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FinancePage } from './finance.page';

const routes: Routes = [
  {
    path: '',
    component: FinancePage
  },  {
    path: 'mensalidades',
    loadChildren: () => import('./mensalidades/mensalidades.module').then( m => m.MensalidadesPageModule)
  }

];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FinancePageRoutingModule {}
