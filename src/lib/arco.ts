/** Geometría del arco, aparte del componente para poder probarla. */
export type Geometria = { cx: number; cy: number; rx: number; ry: number };

/** Dónde cae el día `i` sobre la curva. θ va de π (izquierda) a 0 (derecha). */
export function puntoDelDia(i: number, dias: number, g: Geometria) {
  const t = dias === 1 ? 0.5 : i / (dias - 1);
  const th = Math.PI * (1 - t);
  return { x: g.cx + g.rx * Math.cos(th), y: g.cy - g.ry * Math.sin(th), th };
}

/**
 * Del dedo al día. Se usa el ÁNGULO desde el centro, no la posición
 * horizontal: así se puede trazar la curva con el dedo y los extremos no se
 * vuelven hipersensibles (con la x, un píxel cerca del borde saltaría diez
 * días, porque el arco allí es casi vertical).
 */
export function diaDesdeElDedo(
  px: number, py: number, dias: number, g: Geometria,
): number {
  // Por debajo del horizonte el ángulo no significa nada: se sujeta a la línea.
  const dy = Math.max(g.cy - py, 0.001);
  // Los puntos van sobre una ELIPSE, no sobre un círculo. Hay que dividir por
  // cada radio antes de sacar el ángulo, o el que devuelve no es el mismo con
  // el que se colocaron: tocarías el día 22 y respondería el 17.
  let th = Math.atan2(dy / g.ry, (px - g.cx) / g.rx);
  th = Math.max(0, Math.min(Math.PI, th));
  const t = 1 - th / Math.PI;
  return Math.max(0, Math.min(dias - 1, Math.round(t * (dias - 1))));
}

/** Cuánto crece un punto según lo lejos que esté del dedo. Campana suave: sin
 *  saltos, que es lo que hace que el gesto se sienta bien. */
export function aumento(distancia: number, alcance: number, crece: number): number {
  return 1 + crece * Math.exp(-((distancia / alcance) ** 2));
}
