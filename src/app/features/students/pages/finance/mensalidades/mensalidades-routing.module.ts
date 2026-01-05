import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MensalidadesPage } from './mensalidades.page';

const routes: Routes = [
  {
    path: '',
    component: MensalidadesPage
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MensalidadesPageRoutingModule {}
