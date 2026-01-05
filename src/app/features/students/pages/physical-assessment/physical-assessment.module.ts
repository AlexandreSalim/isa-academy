import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PhysicalAssessmentPageRoutingModule } from './physical-assessment-routing.module';

import { PhysicalAssessmentPage } from './physical-assessment.page';
import { HeaderComponent } from "src/app/shared/components/header/header.component";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PhysicalAssessmentPageRoutingModule,
    HeaderComponent
],
  declarations: [PhysicalAssessmentPage]
})
export class PhysicalAssessmentPageModule {}
