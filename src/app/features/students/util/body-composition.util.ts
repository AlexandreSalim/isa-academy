export type Sex = 'M'|'F';

export function parseNumber(v: any): number | null {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export function parseHeightMeters(h: any): number | null {
  const n = parseNumber(h);
  if (n === null) return null;
  if (n > 3) return n / 100;
  return n;
}

export function computeAgeFromDob(dobStr?: string): number | null {
  if (!dobStr) return null;
  const d = new Date(dobStr);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

/* Jackson & Pollock 7-site */
export function densityFrom7Site(sum7: number, age: number, sex: Sex): number {
  if (sex === 'M') {
    return 1.112 - 0.00043499 * sum7 + 0.00000055 * (sum7 * sum7) - 0.00028826 * age;
  } else {
    return 1.097 - 0.00046971 * sum7 + 0.00000056 * (sum7 * sum7) - 0.00012828 * age;
  }
}

/* Jackson & Pollock 3-site */
export function densityFrom3Site(sum3: number, age: number, sex: Sex): number {
  if (sex === 'M') {
    return 1.10938 - 0.0008267 * sum3 + 0.0000016 * (sum3 * sum3) - 0.0002574 * age;
  } else {
    return 1.0994921 - 0.0009929 * sum3 + 0.0000023 * (sum3 * sum3) - 0.0001392 * age;
  }
}

/* Siri */
export function fatFromDensity(density: number): number {
  if (!density || density <= 0) return NaN;
  return (495 / density) - 450;
}

/* Única função pública que unifica tudo:
   input: objeto que contenha peso, altura, dobras, sexo, idade etc.
   output: valores numéricos e strings prontas para UI.
*/
export function computeBodyComposition(input: any, student?: any) {
  const peso = parseNumber(input?.weight);
  const altura = parseHeightMeters(input?.height);

  const sexRaw = (input?.gender ?? student?.gender ?? '').toString().toUpperCase();
  const sex: Sex = (sexRaw.startsWith('F') || sexRaw === 'FEMININO' || sexRaw === 'FEMALE') ? 'F' : 'M';

  const ageFromInput = parseNumber(input?.age) ?? null;
  const ageFromUser = computeAgeFromDob(student?.date_of_birth);
  const age = ageFromInput ?? ageFromUser ?? 30;

  // try provided density / percent first
  let densityNum = parseNumber(input?.densidade ?? input?.density ?? null);
  let fat = parseNumber(input?.percentual_gordura ?? input?.fatPercent ?? null);

  // folds
  const folds = {
    subescapular: parseNumber(input?.subscapular),
    triceps: parseNumber(input?.triceps),
    peitoral: parseNumber(input?.chest_skinfold),
    axilar: parseNumber(input?.mid_axillary),
    suprailiaca: parseNumber(input?.suprailiac),
    abdominal: parseNumber(input?.abdominal_skinfold),
    femural: parseNumber(input?.femoral)
  };
  const foldValues = Object.values(folds).filter(v => v !== null) as number[];

  // calculos padronizados: 7-site (se >=4) -> 3-site -> fallback
  if ((fat === null || isNaN(fat)) && !densityNum && foldValues.length >= 4) {
    const sum7 = foldValues.reduce((s, x) => s + x, 0);
    densityNum = densityFrom7Site(sum7, age, sex);
    fat = fatFromDensity(densityNum);
  }

  if ((fat === null || isNaN(fat)) && !densityNum) {
    // aplica regra 3-site dependendo do sexo
    let three: number[] = [];
    if (sex === 'M') {
      const a = parseNumber(input?.chest_skinfold);
      const b = parseNumber(input?.abdominal_skinfold);
      const c = parseNumber(input?.femoral);
      three = [a,b,c].filter(v => v !== null) as number[];
    } else {
      const a = parseNumber(input?.triceps);
      const b = parseNumber(input?.suprailiac);
      const c = parseNumber(input?.femoral);
      three = [a,b,c].filter(v => v !== null) as number[];
    }
    if (three.length === 3) {
      const sum3 = three.reduce((s,x) => s + x, 0);
      densityNum = densityFrom3Site(sum3, age, sex);
      fat = fatFromDensity(densityNum);
    }
  }

  // IMC
  let imcVal: number | null = null;
  if (peso !== null && altura !== null && altura > 0) imcVal = +(peso / (altura * altura));

  // prepara saídas
  const fatPercentNum = (fat !== null && !isNaN(fat)) ? +(+fat).toFixed(4) : null; // guarda alta precisão
  const fatPercentStr = fatPercentNum !== null ? `${(+fatPercentNum).toFixed(2)}%` : '—';

  const densidadeStr = (densityNum !== null && !isNaN(densityNum)) ? `${densityNum.toFixed(3)} g/cm³` : (input?.densidade ?? '—');

  let leanKg: number | null = null;
  let fatKg: number | null = null;
  let leanPctStr = '—';
  if (peso !== null && fatPercentNum !== null) {
    leanKg = +(peso * (1 - fatPercentNum / 100));
    fatKg = +(peso - leanKg);
    leanPctStr = `${(100 - fatPercentNum).toFixed(1)}%`;
  }

  return {
    peso, altura, imcVal,
    fatPercentNum, fatPercentStr,
    densidadeNum: densityNum ?? null, densidadeStr,
    leanKg, fatKg, leanPctStr
  };
}
