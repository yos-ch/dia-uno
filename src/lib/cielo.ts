/**
 * El cielo del producto.
 *
 * La idea: la app se llama «arco», y un arco es el camino del sol por el cielo.
 * Así que el fondo es el cielo a TU hora local, y el arco de tu tramo es la
 * trayectoria del sol. No es adorno: es la misma metáfora del producto.
 *
 * Dos reglas que no se rompen:
 *  1. El cielo nunca aclara tanto como para que el texto blanco deje de leerse.
 *     Varía el tono y un poco la luz, no el contraste.
 *  2. El ámbar sigue siendo SOLO de lo cumplido. Por eso ninguna franja del
 *     cielo es ámbar saturado: al atardecer tira a ciruela, no a naranja.
 */

export type Franja = {
  nombre: string;
  desde: number;          // hora local, 0-23
  arriba: string;         // color alto del degradado
  abajo: string;          // color bajo, hacia el horizonte
  sol: string;            // color del astro
  brillo: string;         // halo del astro
};

export const FRANJAS: Franja[] = [
  { nombre: 'madrugada', desde: 0,  arriba: '#070B14', abajo: '#0D1526', sol: '#8FA6C9', brillo: '#8FA6C933' },
  { nombre: 'alba',      desde: 5,  arriba: '#0B1226', abajo: '#2A2140', sol: '#C9A0C0', brillo: '#C9A0C044' },
  { nombre: 'amanecer',  desde: 7,  arriba: '#122043', abajo: '#4A3352', sol: '#F0B49A', brillo: '#F0B49A4D' },
  { nombre: 'mañana',    desde: 9,  arriba: '#14294F', abajo: '#2C4A6B', sol: '#FFD9A0', brillo: '#FFD9A044' },
  { nombre: 'mediodía',  desde: 12, arriba: '#173A63', abajo: '#2E6182', sol: '#FFE9B8', brillo: '#FFE9B84D' },
  { nombre: 'tarde',     desde: 16, arriba: '#153352', abajo: '#3F4266', sol: '#FFC98A', brillo: '#FFC98A44' },
  { nombre: 'atardecer', desde: 18, arriba: '#101A38', abajo: '#42284A', sol: '#E0A0A8', brillo: '#E0A0A844' },
  { nombre: 'noche',     desde: 21, arriba: '#070B14', abajo: '#101A2E', sol: '#8FA6C9', brillo: '#8FA6C933' },
];

export function franjaDe(hora: number): Franja {
  let f = FRANJAS[FRANJAS.length - 1];
  for (const c of FRANJAS) if (hora >= c.desde) f = c;
  return f;
}

/** El cielo de ahora mismo, con la hora del navegador de quien mira. */
export function cieloAhora(horaForzada?: number): Franja {
  const h = horaForzada ?? new Date().getHours();
  return franjaDe(Math.max(0, Math.min(23, h)));
}
