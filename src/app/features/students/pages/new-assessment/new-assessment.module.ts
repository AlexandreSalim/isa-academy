import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { NewAssessmentPageRoutingModule } from './new-assessment-routing.module';

import { NewAssessmentPage } from './new-assessment.page';
import { HeaderComponent } from "src/app/shared/components/header/header.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NewAssessmentPageRoutingModule,
    HeaderComponent,
    ReactiveFormsModule
],
  declarations: [NewAssessmentPage]
})
export class NewAssessmentPageModule {}
