'use client';

import { useEffect, useMemo, useOptimistic, startTransition, useState } from 'react';
import type { Arco } from '@/lib/datos';
import { alternarMarca } from '@/lib/acciones';
import { hoy, sumarDias, diaDelArco, racha, fechaBonita, distancia } from '@/lib/fechas';

export default function Tablero({ arco }: { arco: Arco }) {
  // El día SOLO lo decide el navegador de quien mira. No se puede calcular en
  // el servidor: en producción corre en UTC, así que a partir de las 18:00 de
  // México ya estaría en el día siguiente y pintaría un número equivocado
  // —además de romper la hidratación—. Por eso esperamos a montar.
  const [dia, setDia] = useState<string | null>(null);
  useEffect(() => {
    setDia(hoy());
    // Si alguien deja la pestaña abierta y cruza la medianoche, que se entere.
    const id = setInterval(() => setDia(hoy()), 60_000);
    return () => clearInterval(id);
  }, []);
  const nDia = dia ? diaDelArco(arco.empieza, dia) : 0;
  const arrancado = nDia >= 1;

  const [marcas, marcarOptimista] = useOptimistic(
    arco.marcas,
    (previo: Arco['marcas'], cambio: { habito: string; dia: string }) => {
      const copia = { ...previo };
      const lista = new Set(copia[cambio.dia] ?? []);
      lista.has(cambio.habito) ? lista.delete(cambio.habito) : lista.add(cambio.habito);
      copia[cambio.dia] = [...lista];
      return copia;
    },
  );

  const hechosHoy = new Set(dia ? marcas[dia] ?? [] : []);
  const total = arco.habitos.length;

  const diasCompletos = useMemo(() => {
    const s = new Set<string>();
    for (const [d, ids] of Object.entries(marcas)) {
      if (ids.length >= total && total > 0) s.add(d);
    }
    return s;
  }, [marcas, total]);

  const laRacha = dia ? racha(diasCompletos, dia) : 0;

  function alternar(habitoId: string) {
    if (!dia) return;
    startTransition(() => {
      marcarOptimista({ habito: habitoId, dia });
      alternarMarca(habitoId, dia);
    });
  }

  // Un esqueleto del mismo alto mientras se resuelve el día, para que no salte
  // el diseño en el primer fotograma.
  if (!dia) return <Esqueleto habitos={arco.habitos.length} dias={arco.dias} />;

  return (
    <div className="space-y-10">
      <header>
        <p className="font-display text-sm uppercase tracking-[0.18em] text-tinta-3">
          {arco.titulo}
        </p>
        {arrancado ? (
          <h1 className="font-display text-6xl font-bold mt-2 tabular-nums">
            Día {nDia}
            <span className="text-tinta-3 text-3xl font-medium"> de {arco.dias}</span>
          </h1>
        ) : (
          <h1 className="font-display text-4xl font-bold mt-2 text-balance">
            Empieza el {fechaBonita(arco.empieza)}
            <span className="block text-lg font-medium text-tinta-2 mt-2">
              Faltan {distancia(dia, arco.empieza)} días. Nadie te obliga a esperar.
            </span>
          </h1>
        )}
        {arrancado && laRacha > 0 && (
          <p className="mt-3 text-brasa font-display text-lg">
            {laRacha} {laRacha === 1 ? 'día seguido' : 'días seguidos'}
          </p>
        )}
      </header>

      <section aria-label="Hábitos de hoy">
        <h2 className="text-sm uppercase tracking-wider text-tinta-3 mb-3">Hoy</h2>
        <ul className="space-y-2">
          {arco.habitos.map((h) => {
            const listo = hechosHoy.has(h.id);
            return (
              <li key={h.id}>
                <button
                  onClick={() => alternar(h.id)}
                  aria-pressed={listo}
                  className={`w-full flex items-center gap-4 rounded-xl border px-4 py-4
                    text-left transition
                    ${listo
                      ? 'border-brasa/40 bg-brasa/10'
                      : 'border-linea bg-losa hover:bg-losa-alta'}`}
                >
                  <span
                    aria-hidden
                    className={`grid h-6 w-6 flex-none place-items-center rounded-md border
                      ${listo ? 'border-brasa bg-brasa' : 'border-linea'}`}
                  >
                    {listo && (
                      <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none"
                           stroke="#0B111C" strokeWidth="2.2" strokeLinecap="round"
                           strokeLinejoin="round">
                        <path d="M2.5 6.2l2.4 2.4L9.5 3.8" />
                      </svg>
                    )}
                  </span>
                  <span className={listo ? 'text-tinta' : 'text-tinta-2'}>{h.nombre}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Rejilla arco={arco} marcas={marcas} hoyStr={dia} total={total} />
    </div>
  );
}

/** El arco entero de un vistazo. Ver los huecos motiva más que cualquier cifra. */
function Rejilla({
  arco, marcas, hoyStr, total,
}: { arco: Arco; marcas: Arco['marcas']; hoyStr: string; total: number }) {
  const celdas = Array.from({ length: arco.dias }, (_, i) => {
    const d = sumarDias(arco.empieza, i);
    const hechos = (marcas[d] ?? []).length;
    const futuro = distancia(hoyStr, d) > 0;
    return { d, i, hechos, futuro };
  });
  const completos = celdas.filter((c) => total > 0 && c.hechos >= total).length;

  return (
    <section aria-label="Todo el arco">
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-sm uppercase tracking-wider text-tinta-3">El arco</h2>
        <p className="text-sm text-tinta-2 tabular-nums">
          {completos} de {arco.dias} completos
        </p>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))' }}>
        {celdas.map((c) => {
          const lleno = total > 0 && c.hechos >= total;
          const parcial = c.hechos > 0 && !lleno;
          return (
            <span
              key={c.d}
              title={`${fechaBonita(c.d)} · ${c.hechos}/${total}`}
              className={`aspect-square rounded-[3px] ${
                lleno ? 'bg-brasa'
                : parcial ? 'bg-brasa/35'
                : c.futuro ? 'bg-losa'
                : 'bg-losa-alta'}`}
            />
          );
        })}
      </div>
      <p className="mt-3 text-xs text-tinta-3">
        Cada cuadro es un día. Los que brillan son los que cumpliste entero.
      </p>
    </section>
  );
}


function Esqueleto({ habitos, dias }: { habitos: number; dias: number }) {
  return (
    <div className="space-y-10 animate-pulse" aria-hidden>
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-losa" />
        <div className="h-14 w-64 rounded bg-losa" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: habitos }, (_, i) => (
          <div key={i} className="h-14 rounded-xl bg-losa" />
        ))}
      </div>
      <div className="grid gap-1.5"
           style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(14px, 1fr))' }}>
        {Array.from({ length: dias }, (_, i) => (
          <span key={i} className="aspect-square rounded-[3px] bg-losa" />
        ))}
      </div>
    </div>
  );
}
