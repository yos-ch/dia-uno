'use client';

import { useEffect, useMemo, useOptimistic, startTransition, useState } from 'react';
import type { Arco as DatosArco } from '@/lib/datos';
import { alternarMarca } from '@/lib/acciones';
import { hoy, diaDelArco, racha, fechaBonita, distancia } from '@/lib/fechas';
import { cieloAhora } from '@/lib/cielo';
import Arco from './Arco';

export default function Tablero({ arco }: { arco: DatosArco }) {
  // El día SOLO lo decide el navegador de quien mira. No se puede calcular en
  // el servidor: en producción corre en UTC, así que a partir de las 18:00 de
  // México ya estaría en el día siguiente y pintaría un número equivocado
  // —además de romper la hidratación—. Por eso esperamos a montar.
  const [dia, setDia] = useState<string | null>(null);
  const [hora, setHora] = useState<number | null>(null);
  useEffect(() => {
    // Permite mirar cualquier hora con ?hora=6, para revisar el cielo sin
    // esperar a que anochezca.
    const forzada = new URLSearchParams(location.search).get('hora');
    const leer = () => {
      setDia(hoy());
      setHora(forzada !== null ? Number(forzada) : new Date().getHours());
    };
    leer();
    // Si alguien deja la pestaña abierta y cruza la medianoche —o el amanecer—,
    // que se entere.
    const id = setInterval(leer, 60_000);
    return () => clearInterval(id);
  }, []);

  // El cielo se escribe en el elemento raíz para que cubra el lienzo entero.
  useEffect(() => {
    if (hora === null) return;
    const c = cieloAhora(hora);
    const raiz = document.documentElement;
    raiz.style.setProperty('--cielo-a', c.arriba);
    raiz.style.setProperty('--cielo-b', c.abajo);
  }, [hora]);
  const nDia = dia ? diaDelArco(arco.empieza, dia) : 0;
  const arrancado = nDia >= 1;

  const [marcas, marcarOptimista] = useOptimistic(
    arco.marcas,
    (previo: DatosArco['marcas'], cambio: { habito: string; dia: string }) => {
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

  const cielo = cieloAhora(hora ?? undefined);

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
                  {/* Una brasa que enciende, no una palomita: la palomita la
                      llevan todos, y aquí el lenguaje es el del fuego. */}
                  <span
                    aria-hidden
                    className={`h-3.5 w-3.5 flex-none rounded-full transition-all duration-300
                      ${listo
                        ? 'bg-brasa shadow-[0_0_14px_3px_rgba(242,166,90,0.45)]'
                        : 'bg-transparent ring-1 ring-linea'}`}
                  />
                  <span className={listo ? 'text-tinta' : 'text-tinta-2'}>{h.nombre}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <Arco arco={arco} marcas={marcas} hoyStr={dia} total={total} cielo={cielo} />
    </div>
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
