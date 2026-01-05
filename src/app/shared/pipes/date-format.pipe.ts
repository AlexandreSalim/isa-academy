// date-format.pipe.ts (pequeno ajuste)
import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'dateFormat',
  standalone: true
})
export class DateFormatPipe implements PipeTransform {
  transform(value: string | Date | null | undefined, format: string = 'DD/MM/YYYY'): string {
    if (!value) return '';

    // aceitar strings no formato ISO ou "YYYY-MM-DD"
    const date = typeof value === 'string' ? new Date(value) : value;
    if (!date || isNaN(date.getTime())) return '';

    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();

    return format.replace('DD', day).replace('MM', month).replace('YYYY', year.toString());
  }
}
