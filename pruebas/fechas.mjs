// Pruebas de las funciones puras: aquí es donde el producto acierta o miente.
import assert from 'node:assert/strict';
import { aDia, sumarDias, distancia, diaDelArco, racha } from '../src/lib/fechas.ts';

let ok = 0;
const t = (nombre, fn) => { fn(); ok++; console.log('  ✓', nombre); };

t('el primer día del arco es el 1, no el 0', () => {
  assert.equal(diaDelArco('2026-09-01', '2026-09-01'), 1);
  assert.equal(diaDelArco('2026-09-01', '2026-09-06'), 6);
});

t('antes de empezar da 0 o negativo', () => {
  assert.equal(diaDelArco('2026-09-10', '2026-09-09'), 0);
  assert.equal(diaDelArco('2026-09-10', '2026-09-08'), -1);
});

t('cruza el cambio de mes y de año', () => {
  assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(distancia('2026-01-31', '2026-02-01'), 1);
});

t('sobrevive al cambio de horario de verano', () => {
  // En México el horario cambia a finales de octubre; con Date puro esto
  // devolvería 0.958 días y redondear mal partiría la racha.
  assert.equal(distancia('2026-10-24', '2026-10-26'), 2);
});

t('la racha cuenta días seguidos hasta hoy', () => {
  const s = new Set(['2026-08-30', '2026-08-31', '2026-09-01']);
  assert.equal(racha(s, '2026-09-01'), 3);
});

t('hoy incompleto NO rompe la racha: el día no ha terminado', () => {
  const s = new Set(['2026-08-30', '2026-08-31']);
  assert.equal(racha(s, '2026-09-01'), 2);
});

t('un hueco de ayer sí la rompe', () => {
  const s = new Set(['2026-08-28', '2026-08-29']);
  assert.equal(racha(s, '2026-09-01'), 0);
});

t('sin nada marcado, racha cero', () => {
  assert.equal(racha(new Set(), '2026-09-01'), 0);
});

console.log(`\n${ok} pruebas pasadas`);
