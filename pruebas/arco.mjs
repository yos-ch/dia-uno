import assert from 'node:assert/strict';
import { puntoDelDia, diaDesdeElDedo, aumento } from '../src/lib/arco.ts';

const g = { cx: 310, cy: 240, rx: 286, ry: 196 };
const DIAS = 90;
let ok = 0;
const t = (n, f) => { f(); ok++; console.log('  ✓', n); };

t('el primer día cae en el extremo izquierdo y el último en el derecho', () => {
  assert.ok(puntoDelDia(0, DIAS, g).x < g.cx - g.rx + 1);
  assert.ok(puntoDelDia(DIAS - 1, DIAS, g).x > g.cx + g.rx - 1);
});

t('el día de en medio cae en lo más alto', () => {
  const medio = puntoDelDia(Math.floor((DIAS - 1) / 2), DIAS, g);
  assert.ok(Math.abs(medio.y - (g.cy - g.ry)) < 3);
});

t('tocar sobre un punto devuelve ese mismo día (ida y vuelta)', () => {
  for (const i of [0, 1, 22, 45, 67, 89]) {
    const p = puntoDelDia(i, DIAS, g);
    assert.equal(diaDesdeElDedo(p.x, p.y, DIAS, g), i, `falla en el día ${i}`);
  }
});

t('tocar por debajo del horizonte no se sale de rango', () => {
  assert.equal(diaDesdeElDedo(g.cx - g.rx - 200, g.cy + 90, DIAS, g), 0);
  assert.equal(diaDesdeElDedo(g.cx + g.rx + 200, g.cy + 90, DIAS, g), DIAS - 1);
});

t('arrastrar en horizontal nunca retrocede', () => {
  let previo = -1;
  for (let x = g.cx - g.rx; x <= g.cx + g.rx; x += 2) {
    const i = diaDesdeElDedo(x, g.cy - g.ry * 0.6, DIAS, g);
    assert.ok(i >= previo, `retrocedió en x=${x}`);
    previo = i;
  }
  // A media altura la curva no llega a los extremos: para el día 1 y el 90 hay
  // que bajar siguiendo el arco. Es correcto, y por eso no se exige aquí.
  assert.ok(previo > DIAS * 0.7, 'debería cubrir buena parte del tramo');
});

t('trazar la curva con el dedo sí recorre el arco entero', () => {
  const vistos = new Set();
  for (let k = 0; k <= 400; k++) {
    const th = Math.PI * (1 - k / 400);
    vistos.add(diaDesdeElDedo(
      g.cx + g.rx * Math.cos(th), g.cy - g.ry * Math.sin(th), DIAS, g));
  }
  assert.ok(vistos.has(0) && vistos.has(DIAS - 1));
  assert.equal(vistos.size, DIAS, 'no debería saltarse ningún día');
});

t('el aumento es máximo bajo el dedo y se apaga suave', () => {
  assert.ok(Math.abs(aumento(0, 5, 2.4) - 3.4) < 1e-9);
  assert.ok(aumento(2, 5, 2.4) < aumento(1, 5, 2.4));
  assert.ok(aumento(15, 5, 2.4) < 1.01);          // lejos, ya no crece
});

t('un arco de un solo día no divide entre cero', () => {
  const p = puntoDelDia(0, 1, g);
  assert.ok(Number.isFinite(p.x) && Number.isFinite(p.y));
  assert.equal(diaDesdeElDedo(p.x, p.y, 1, g), 0);
});

console.log(`\n${ok} pruebas pasadas`);
