// src/app/shared/month-picker/month-picker.service.ts
import { Injectable } from '@angular/core';
import { PickerController } from '@ionic/angular';

export interface MonthPickerResult {
  monthIndex: number; // 0..11
  year: number;
  display: string; // ex: "Dezembro/2025"
}

export interface MonthPickerOptions {
  startYear?: number;
  endYear?: number;
  initialMonth?: number;
  initialYear?: number;
  monthNames?: string[];
  okText?: string;
  cancelText?: string;
}

@Injectable({ providedIn: 'root' })
export class MonthPickerService {
  private defaultMonthNames = [
    'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
  ];

  constructor(private pickerCtrl: PickerController) {}

  async open(options: MonthPickerOptions = {}): Promise<MonthPickerResult | null> {
    const now = new Date();
    const currentYear = now.getFullYear();

    const monthNames = options.monthNames ?? this.defaultMonthNames;
    const initialMonth = (typeof options.initialMonth === 'number') ? options.initialMonth : now.getMonth();
    const initialYear = options.initialYear ?? currentYear;
    const startYear = options.startYear ?? (currentYear - 5);
    const endYear = options.endYear ?? (currentYear + 5);
    const okText = options.okText ?? 'OK';
    const cancelText = options.cancelText ?? 'Cancelar';

    const monthOptions = monthNames.map((m, i) => ({ text: m, value: i }));
    const yearOptions: Array<{text:string, value:number}> = [];
    for (let y = startYear; y <= endYear; y++) yearOptions.push({ text: String(y), value: y });

    const yearSelectedIndex = Math.max(0, Math.min(yearOptions.length - 1, initialYear - startYear));

    // variável que iremos preencher no handler do botão OK
    let pickedMonth: number | undefined;
    let pickedYear: number | undefined;

    const picker = await this.pickerCtrl.create({
      columns: [
        { name: 'month', options: monthOptions, selectedIndex: initialMonth },
        { name: 'year',  options: yearOptions,  selectedIndex: yearSelectedIndex }
      ],
      buttons: [
        { text: cancelText, role: 'cancel' },
        {
          text: okText,
          handler: (selected: any) => {
            // handler pode receber objeto ou array dependendo da plataforma
            try {
              // caso padrão: selected.month / selected.year
              if (selected && selected.month !== undefined && selected.year !== undefined) {
                pickedMonth = Number(selected.month?.value ?? selected.month);
                pickedYear  = Number(selected.year?.value ?? selected.year);
                return;
              }

              // caso onde handler recebe array (ex: [{name:'month', value:...}, {name:'year', value:...}])
              if (Array.isArray(selected)) {
                const m = selected.find((s: any) => s.name === 'month');
                const y = selected.find((s: any) => s.name === 'year');
                if (m) pickedMonth = Number(m.value ?? m.options?.[m.selectedIndex]?.value);
                if (y) pickedYear  = Number(y.value ?? y.options?.[y.selectedIndex]?.value);
                return;
              }

              // fallback: selected may be object with values property
              if (selected && selected.values) {
                pickedMonth = Number(selected.values.month ?? selected.values.monthIndex);
                pickedYear  = Number(selected.values.year);
                return;
              }
            } catch (err) {
              // não falhar aqui — vamos tentar métodos alternativos depois
            }
          }
        }
      ]
    });

    await picker.present();

    const { data, role } = await picker.onDidDismiss();
    if (role === 'cancel') return null;

    // se handler já preencheu pickedMonth/pickedYear, use-os
    if (pickedMonth != null && pickedYear != null) {
      const monthIndex = Number(pickedMonth);
      const year = Number(pickedYear);
      if (!isNaN(monthIndex) && !isNaN(year) && monthIndex >= 0 && monthIndex <= 11) {
        return { monthIndex, year, display: `${monthNames[monthIndex]}/${year}` };
      }
    }

    // --- fallback: tentar extrair de várias maneiras (como antes) ---
    let selMonth: any = undefined;
    let selYear: any = undefined;

    try {
      const anyPicker = picker as any;

      // getColumn api
      if (typeof anyPicker.getColumn === 'function') {
        const colMonth = anyPicker.getColumn('month');
        const colYear = anyPicker.getColumn('year');
        if (colMonth && colMonth.options && colMonth.selectedIndex != null) {
          selMonth = colMonth.options[colMonth.selectedIndex]?.value;
        }
        if (colYear && colYear.options && colYear.selectedIndex != null) {
          selYear = colYear.options[colYear.selectedIndex]?.value;
        }
      }

      // getColumns api
      if ((selMonth === undefined || selYear === undefined) && typeof anyPicker.getColumns === 'function') {
        const cols = anyPicker.getColumns();
        if (Array.isArray(cols)) {
          const mcol = cols.find((c: any) => c.name === 'month');
          const ycol = cols.find((c: any) => c.name === 'year');
          if (mcol && mcol.options && mcol.selectedIndex != null) selMonth = selMonth ?? mcol.options[mcol.selectedIndex]?.value;
          if (ycol && ycol.options && ycol.selectedIndex != null) selYear  = selYear  ?? ycol.options[ycol.selectedIndex]?.value;
        }
      }

      // dados do onDidDismiss (formatos variados)
      if ((selMonth === undefined || selYear === undefined) && data) {
        if (data.values) {
          selMonth = selMonth ?? data.values.month;
          selYear  = selYear  ?? data.values.year;
        }
        selMonth = selMonth ?? data.month ?? data.values?.month;
        selYear  = selYear  ?? data.year  ?? data.values?.year;
      }

      // propriedades diretas (cols/columns)
      if ((selMonth === undefined || selYear === undefined) && (anyPicker.columns || anyPicker.cols)) {
        const colsArr = anyPicker.columns || anyPicker.cols;
        if (Array.isArray(colsArr)) {
          const mcol = colsArr.find((c: any) => c.name === 'month');
          const ycol = colsArr.find((c: any) => c.name === 'year');
          if (mcol && mcol.options && mcol.selectedIndex != null) selMonth = selMonth ?? mcol.options[mcol.selectedIndex]?.value;
          if (ycol && ycol.options && ycol.selectedIndex != null) selYear  = selYear  ?? ycol.options[ycol.selectedIndex]?.value;
        }
      }
    } catch (err) {
      // ignore
    }

    const monthIndex = selMonth != null ? Number(selMonth) : NaN;
    const year = selYear != null ? Number(selYear) : NaN;

    if (isNaN(monthIndex) || isNaN(year) || monthIndex < 0 || monthIndex > 11) {
      return null;
    }

    return { monthIndex, year, display: `${monthNames[monthIndex]}/${year}` };
  }
}
