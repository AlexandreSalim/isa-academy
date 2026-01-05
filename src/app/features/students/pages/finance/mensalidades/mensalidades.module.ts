import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MensalidadesPageRoutingModule } from './mensalidades-routing.module';

import { MensalidadesPage } from './mensalidades.page';

import {MatListModule} from '@angular/material/list';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MensalidadesPageRoutingModule,
    MatListModule
  ],
  declarations: [MensalidadesPage]
})
export class MensalidadesPageModule {}
