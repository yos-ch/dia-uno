'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Arco as DatosArco } from '@/lib/datos';
import type { Franja } from '@/lib/cielo';
import { sumarDias, distancia, fechaBonita } from '@/lib/fechas';
import { puntoDelDia, diaDesdeElDedo, aumento } from '@/lib/arco';


/** Cuánto crece el punto bajo el dedo y cuántos vecinos arrastra consigo. */
const CRECE = 2.4;
const ALCANCE = 5;

type Punto = {
  d: string; i: number; hechos: string[];
  lleno: boolean; parcial: boolean; futuro: boolean;
  x: number; y: number; th: number;
};

export default function Arco({
  arco, marcas, hoyStr, total, cielo,
}: {
  arco: DatosArco; marcas: DatosArco['marcas']; hoyStr: string;
  total: number; cielo: Franja;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [foco, setFoco] = useState<number | null>(null);
  const [tocando, setTocando] = useState(false);

  /* En móvil, `touch-action: none` no siempre basta: si el navegador ya decidió
     que el gesto es un scroll, sigue desplazando la página aunque arrastres
     sobre los puntos. Hay que cancelarlo a mano, y para eso el escucha tiene
     que ser NO pasivo —React los registra pasivos y ahí preventDefault se
     ignora sin avisar—. Por eso se engancha a pelo sobre el nodo. */
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const frenar = (e: TouchEvent) => { e.preventDefault(); };
    svg.addEventListener('touchmove', frenar, { passive: false });
    svg.addEventListener('touchstart', frenar, { passive: false });
    return () => {
      svg.removeEventListener('touchmove', frenar);
      svg.removeEventListener('touchstart', frenar);
    };
  }, []);

  // En un teléfono el lienzo es estrecho: si mantuviéramos la proporción de
  // escritorio el arco saldría casi plano. Se peralta.
  const [movil, setMovil] = useState(false);
  useEffect(() => {
    const mq = matchMedia('(max-width: 640px)');
    const ver = () => setMovil(mq.matches);
    ver();
    mq.addEventListener('change', ver);
    return () => mq.removeEventListener('change', ver);
  }, []);

  const ANCHO = movil ? 420 : 620;
  const ALTO = movil ? 300 : 270;
  const rx = ANCHO / 2 - 24;
  const ry = ALTO - 74;
  const cx = ANCHO / 2;
  const cy = ALTO - 30;

  const geo = useMemo(() => ({ cx, cy, rx, ry }), [cx, cy, rx, ry]);
  const punto = useCallback(
    (i: number) => puntoDelDia(i, arco.dias, geo), [arco.dias, geo]);

  const dias: Punto[] = useMemo(() => Array.from({ length: arco.dias }, (_, i) => {
    const d = sumarDias(arco.empieza, i);
    const hechos = marcas[d] ?? [];
    const lleno = total > 0 && hechos.length >= total;
    return {
      d, i, hechos,
      lleno,
      parcial: hechos.length > 0 && !lleno,
      futuro: distancia(hoyStr, d) > 0,
      ...punto(i),
    };
  }), [arco.dias, arco.empieza, marcas, total, hoyStr, punto]);

  const iHoy = distancia(arco.empieza, hoyStr);
  const dentro = iHoy >= 0 && iHoy < arco.dias;
  const completos = dias.filter((x) => x.lleno).length;
  const radio = arco.dias > 180 ? 2.2 : arco.dias > 100 ? 2.8 : 3.4;

  /** Del dedo al día: por ángulo desde el centro, así se puede trazar la curva
   *  con el dedo en vez de tener que acertar en un punto de 3 píxeles. */
  function diaBajoElDedo(e: React.PointerEvent<SVGSVGElement>) {
    const svg = svgRef.current;
    if (!svg) return null;
    const caja = svg.getBoundingClientRect();
    const px = ((e.clientX - caja.left) / caja.width) * ANCHO;
    const py = ((e.clientY - caja.top) / caja.height) * ALTO;
    return diaDesdeElDedo(px, py, arco.dias, geo);
  }

  const seguir = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!tocando) return;
    const i = diaBajoElDedo(e);
    if (i !== null) setFoco(i);
  };

  // La ficha muestra hoy por defecto, pero la lupa SOLO aparece cuando tocas:
  // en reposo el arco tiene que verse limpio, no con un bulto permanente.
  const elegido = foco ?? (dentro ? iHoy : null);
  const lupa = foco;
  const dato = elegido !== null ? dias[elegido] : null;

  return (
    <section aria-label="Tu arco">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm uppercase tracking-wider text-tinta-3">Tu arco</h2>
        <p className="text-sm text-tinta-2 tabular-nums">{completos} de {arco.dias}</p>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${ANCHO} ${ALTO}`}
        className="w-full h-auto touch-none select-none cursor-pointer"
        role="img"
        aria-label={`${completos} de ${arco.dias} días completos`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          setTocando(true);
          const i = diaBajoElDedo(e);
          if (i !== null) setFoco(i);
        }}
        onPointerMove={seguir}
        onPointerUp={() => setTocando(false)}
        onPointerCancel={() => setTocando(false)}
        onPointerLeave={() => { if (!tocando) setFoco(null); }}
      >
        <defs>
          <radialGradient id="halo">
            <stop offset="0%" stopColor={cielo.brillo} />
            <stop offset="60%" stopColor={cielo.brillo} stopOpacity="0.25" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          {/* La curva se enciende hasta donde has llegado y se apaga después. */}
          <linearGradient id="camino" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#F2A65A" stopOpacity="0.55" />
            <stop offset={`${dentro ? (iHoy / Math.max(1, arco.dias - 1)) * 100 : 0}%`}
                  stopColor="#F2A65A" stopOpacity="0.55" />
            <stop offset={`${dentro ? (iHoy / Math.max(1, arco.dias - 1)) * 100 + 1 : 1}%`}
                  stopColor="#5E708C" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#5E708C" stopOpacity="0.18" />
          </linearGradient>
          <filter id="brillo" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation="3.2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        <line x1={16} y1={cy} x2={ANCHO - 16} y2={cy}
              stroke="currentColor" className="text-linea" strokeWidth="1" opacity="0.6" />

        <path
          d={`M ${punto(0).x} ${punto(0).y} A ${rx} ${ry} 0 0 1 ${punto(arco.dias - 1).x} ${punto(arco.dias - 1).y}`}
          fill="none" stroke="url(#camino)" strokeWidth="2.5" strokeLinecap="round"
        />

        {dias.map((p) => {
          const lejos = lupa === null ? 99 : Math.abs(p.i - lupa);
          // Campana suave: el punto bajo el dedo crece y arrastra a sus vecinos.
          const escala = aumento(lejos, ALCANCE, CRECE);
          const empuje = (escala - 1) / CRECE;
          const r = radio * escala;
          // Se separan un pelo de la curva, hacia fuera, como teclas que suben.
          const sep = 9 * empuje;
          const ox = p.x + Math.cos(p.th) * sep;
          const oy = p.y - Math.sin(p.th) * sep;
          const activo = lejos === 0;
          return (
            <circle
              key={p.d} cx={ox} cy={oy} r={r}
              filter={p.lleno && empuje > 0.35 ? 'url(#brillo)' : undefined}
              className={`transition-[r,cx,cy] duration-150 ease-out ${
                p.lleno ? 'fill-brasa'
                : p.parcial ? 'fill-brasa/45'
                : p.futuro ? 'fill-losa-alta' : 'fill-linea'}`}
              opacity={activo ? 1 : p.futuro ? 0.7 : 1}
            />
          );
        })}

        {dentro && (() => {
          const s = punto(iHoy);
          return (
            <g className="pointer-events-none">
              <circle cx={s.x} cy={s.y} r={44} fill="url(#halo)" className="sol-late" />
              {/* Ocho rayos cortos: bastan para que se lea «sol» y no «punto». */}
              {Array.from({ length: 8 }, (_, k) => {
                const a = (k * Math.PI) / 4;
                return (
                  <line key={k}
                    x1={s.x + Math.cos(a) * 12} y1={s.y + Math.sin(a) * 12}
                    x2={s.x + Math.cos(a) * 18} y2={s.y + Math.sin(a) * 18}
                    stroke={cielo.sol} strokeWidth="1.6" strokeLinecap="round"
                    opacity="0.55" />
                );
              })}
              <circle cx={s.x} cy={s.y} r={8} fill={cielo.sol} filter="url(#brillo)" />
            </g>
          );
        })()}
      </svg>

      <FichaDia dato={dato} arco={arco} total={total} tocando={tocando} />
    </section>
  );
}

/** Lo que hiciste ese día. Se abre debajo del arco al arrastrar el dedo. */
function FichaDia({
  dato, arco, total, tocando,
}: {
  dato: Punto | null; arco: DatosArco; total: number; tocando: boolean;
}) {
  if (!dato) {
    return (
      <p className="mt-2 text-xs text-tinta-3">
        Arrastra el dedo por el arco para ver cada día.
      </p>
    );
  }
  const hechos = dato.hechos;
  return (
    <div
      className={`mt-3 rounded-2xl border border-linea/70 bg-losa/60 backdrop-blur-sm
                  px-4 py-3 transition-all duration-200
                  ${tocando ? 'scale-[1.015]' : 'scale-100'}`}
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-lg">
          Día {dato.i + 1}
          <span className="text-tinta-3 text-sm font-medium"> · {fechaBonita(dato.d)}</span>
        </p>
        <p className="text-sm tabular-nums text-tinta-2">
          {dato.futuro ? 'aún no llega' : `${hechos.length} de ${total}`}
        </p>
      </div>

      {!dato.futuro && (
        <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
          {arco.habitos.map((h) => {
            const listo = hechos.includes(h.id);
            return (
              <li key={h.id} className="flex items-center gap-2 text-sm">
                <span className={`h-2 w-2 rounded-full ${
                  listo ? 'bg-brasa shadow-[0_0_8px_2px_rgba(242,166,90,0.4)]'
                        : 'bg-transparent ring-1 ring-linea'}`} />
                <span className={listo ? 'text-tinta' : 'text-tinta-3 line-through decoration-linea'}>
                  {h.nombre}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
