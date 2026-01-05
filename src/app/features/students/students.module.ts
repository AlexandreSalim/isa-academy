import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StudentsPageRoutingModule } from './students-routing.module';

import { StudentsPage } from './students.page';
import { HeaderComponent } from 'src/app/shared/components/header/header.component';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StudentsPageRoutingModule,
    HeaderComponent,
    IonicModule,
     HttpClientModule,
  ],
  declarations: [StudentsPage]
})
export class StudentsPageModule {}
