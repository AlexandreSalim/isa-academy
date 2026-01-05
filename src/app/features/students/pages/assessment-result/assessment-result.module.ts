import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonButton, IonIcon, IonGrid, IonRow, IonCol } from '@ionic/angular';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';

import { IonicModule } from '@ionic/angular';

import { AssessmentResultPageRoutingModule } from './assessment-result-routing.module';

import { AssessmentResultPage } from './assessment-result.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    AssessmentResultPageRoutingModule,
    CommonModule, HeaderComponent
  ],
  declarations: [AssessmentResultPage]
})
export class AssessmentResultPageModule {}
