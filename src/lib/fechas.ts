/**
 * Todo el producto se mide en DÍAS del calendario de quien lo usa, no en
 * instantes. Por eso guardamos `date` a secas y nunca timestamps: si alguien
 * marca un hábito a las 23:50 en México, ese día es el suyo, no el que diga
 * el reloj del servidor.
 */

/** «2026-09-01» a partir de una fecha local. */
export function aDia(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

/** El día de hoy según el navegador de quien mira. */
export function hoy(): string {
  return aDia(new Date());
}

/** Parsea «2026-09-01» como fecha LOCAL. new Date('2026-09-01') la
 *  interpretaría como UTC y en América te devolvería el día anterior. */
export function deDia(s: string): Date {
  const [a, m, d] = s.split('-').map(Number);
  return new Date(a, m - 1, d);
}

export function sumarDias(s: string, n: number): string {
  const d = deDia(s);
  d.setDate(d.getDate() + n);
  return aDia(d);
}

/** Días completos entre dos fechas (b - a). */
export function distancia(a: string, b: string): number {
  const ms = deDia(b).getTime() - deDia(a).getTime();
  return Math.round(ms / 86_400_000);
}

/** En qué día del arco estamos: 1 el primer día. 0 o menos = aún no empieza. */
export function diaDelArco(empieza: string, dia = hoy()): number {
  return distancia(empieza, dia) + 1;
}

/**
 * Racha actual: días seguidos hasta hoy en que se cumplió TODO.
 * Si hoy aún no está completo no se rompe la racha —el día no ha terminado—,
 * simplemente se cuenta desde ayer.
 */
export function racha(diasCompletos: Set<string>, hasta = hoy()): number {
  let n = 0;
  let cursor = diasCompletos.has(hasta) ? hasta : sumarDias(hasta, -1);
  while (diasCompletos.has(cursor)) {
    n++;
    cursor = sumarDias(cursor, -1);
  }
  return n;
}

export const NOMBRE_MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                           'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function fechaBonita(s: string): string {
  const d = deDia(s);
  return `${d.getDate()} ${NOMBRE_MES[d.getMonth()]}`;
}
