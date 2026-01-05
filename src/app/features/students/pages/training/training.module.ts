import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TrainingPageRoutingModule } from './training-routing.module';

import { TrainingPage } from './training.page';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { DialogCustomComponent } from 'src/app/shared/components/dialog-custom/dialog-custom.component';
import {MatMenuModule} from '@angular/material/menu';
import {MatButtonModule} from '@angular/material/button';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TrainingPageRoutingModule,
    HeaderComponent,
    DragDropModule,
    DialogCustomComponent,
    MatButtonModule,
    MatMenuModule
  ],
  declarations: [TrainingPage],
})
export class TrainingPageModule {}
