import { Component, OnDestroy, Input, OnInit } from '@angular/core';
import { IonicModule, ModalController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { DateFormatPipe } from 'src/app/shared/pipes/date-format.pipe';
import { Subscription } from 'rxjs';

export interface AddEntryResult {
  title: string;
  value: number;
  date: string; // ISO string
  repeat: 'none' | 'monthly';
  repeatInterval?: number;
  // Campos específicos para venda
  quantity?: number;
  unit_price?: number;
  payment_method?: string;
  // Campos específicos para despesa
  category?: string;
  amount?: number;
  notes?: string;
  recurrence_day?: number;
}

type EntryMode = 'entradas' | 'saidas';

@Component({
  selector: 'app-add-entry-modal',
  standalone: true,
  imports: [IonicModule, CommonModule, ReactiveFormsModule, DateFormatPipe],
  templateUrl: './add-entry-modal.component.html',
  styleUrls: ['./add-entry-modal.component.scss'],
})
export class AddEntryModalComponent implements OnDestroy, OnInit {
  @Input() mode: EntryMode = 'entradas';
  @Input() categorias: Array<{ valor: string, label: string }> = [];
  @Input() metodosPagamento: Array<{ valor: string, label: string }> = [];

  form: FormGroup;
  showRecurrenceDay = false;

  private sub = new Subscription();

  constructor(private modalCtrl: ModalController, private fb: FormBuilder) {
    this.form = this.createForm();
  }

ngOnInit(): void {
  // Criar form primeiro
  this.form = this.createForm();
  
  // Se for despesa, ajustar validações
  if (this.isSaida) {
    // Para despesas, quantity e unit_price não são obrigatórios
    this.form.get('quantity')?.clearValidators();
    this.form.get('unit_price')?.clearValidators();
    this.form.get('quantity')?.updateValueAndValidity();
    this.form.get('unit_price')?.updateValueAndValidity();
  }
  
  // Se for entrada, ajustar validações
  if (this.isEntrada) {
    // Para vendas, category e notes não são obrigatórios
    this.form.get('category')?.clearValidators();
    this.form.get('notes')?.clearValidators();
    this.form.get('category')?.updateValueAndValidity();
    this.form.get('notes')?.updateValueAndValidity();
    
    // Quando mudar o value, calcular unit_price se quantity > 0
    this.sub.add(
      this.form.get('value')?.valueChanges.subscribe(value => {
        const quantity = this.form.get('quantity')?.value || 1;
        if (quantity > 0 && value > 0) {
          this.form.get('unit_price')?.setValue(1, { emitEvent: false });
          // this.form.get('unit_price')?.setValue(value / quantity, { emitEvent: false });
        }
      })
    );
    
    // Quando mudar quantity, recalcular unit_price
    // this.sub.add(
    //   this.form.get('quantity')?.valueChanges.subscribe(quantity => {
    //     const value = this.form.get('value')?.value || 0;
    //     if (quantity > 0 && value > 0) {
    //       this.form.get('unit_price')?.setValue(value / quantity, { emitEvent: false });
    //     }
    //   })
    // );
    
    // Quando mudar unit_price, recalcular value
    // this.sub.add(
    //   this.form.get('unit_price')?.valueChanges.subscribe(unitPrice => {
    //     const quantity = this.form.get('quantity')?.value || 1;
    //     if (quantity > 0 && unitPrice > 0) {
    //       this.form.get('value')?.setValue(unitPrice * quantity, { emitEvent: false });
    //     }
    //   })
    // );
  }

  // Observar mudanças no campo repeatMode
  this.sub.add(
    this.form.get('repeatMode')!.valueChanges.subscribe(mode => {
      const repeatIntervalControl = this.form.get('repeatInterval')!;
      if (mode === 'none') {
        repeatIntervalControl.disable();
        this.showRecurrenceDay = false;
      } else {
        repeatIntervalControl.enable();
        this.showRecurrenceDay = true;
      }
    })
  );

  // Inicializar estado
  if (this.form.get('repeatMode')!.value === 'none') {
    this.form.get('repeatInterval')!.disable();
  }
}

private createForm(): FormGroup {
  const form = this.fb.group({
    // Campos comuns
    title: ['', [Validators.required, Validators.maxLength(60)]],
    value: [0, [Validators.required, Validators.min(0.01)]],
    date: [this.todayForInput(), Validators.required],
    repeatMode: ['none'],
    repeatInterval: [1],
    payment_method: ['dinheiro'],
    
    // Campos específicos para venda
    quantity: [1, [Validators.min(1)]],
    unit_price: [0, [Validators.min(0.01)]],
    
    // Campos específicos para despesa
    category: ['outros'],
    notes: [''],
    recurrence_day: [null]
  });

  return form;
}

  get isEntrada() {
    return this.mode === 'entradas';
  }

  get isSaida() {
    return this.mode === 'saidas';
  }

  private todayForInput(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  dismiss(data: AddEntryResult | null = null) {
    this.modalCtrl.dismiss(data);
  }

  onCancel() {
    this.dismiss(null);
  }

onSubmit() {
  if (this.form.invalid) {
    this.form.markAllAsTouched();
    
    // Mostrar quais campos estão inválidos
    Object.keys(this.form.controls).forEach(key => {
      const control = this.form.get(key);
      if (control?.invalid) {
        console.log(`Campo ${key} inválido:`, control.errors);
      }
    });
    
    return;
  }

  const formValue = this.form.value;

  // Converter data para ISO
  let isoDate: string;
  if (formValue.date) {
    const parts = formValue.date.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      isoDate = d.toISOString();
    } else {
      isoDate = new Date(formValue.date).toISOString();
    }
  } else {
    isoDate = new Date().toISOString();
  }

  // Preparar resultado baseado no modo
  const result: AddEntryResult = {
    title: formValue.title.trim(),
    value: Number(formValue.value),
    date: isoDate,
    repeat: formValue.repeatMode === 'none' ? 'none' : 'monthly',
    repeatInterval: formValue.repeatMode === 'none' ? undefined : Number(formValue.repeatInterval),
    payment_method: formValue.payment_method
  };

  if (this.isEntrada) {
    // Adicionar campos específicos de venda
    result.quantity = Number(formValue.quantity);
    result.unit_price = Number(formValue.unit_price);
  } else {
    // Adicionar campos específicos de despesa
    result.category = formValue.category;
    result.amount = Number(formValue.value);
    result.notes = formValue.notes;
    result.recurrence_day = formValue.recurrence_day ? Number(formValue.recurrence_day) : undefined;
  }

  this.dismiss(result);
}

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}