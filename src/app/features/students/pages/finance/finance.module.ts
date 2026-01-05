import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FinancePageRoutingModule } from './finance-routing.module';

import { FinancePage } from './finance.page';
import { HeaderComponent } from "src/app/shared/components/header/header.component";

import {MatExpansionModule} from '@angular/material/expansion';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FinancePageRoutingModule,
    HeaderComponent,
    MatExpansionModule
],
  declarations: [FinancePage]
})
export class FinancePageModule {}
