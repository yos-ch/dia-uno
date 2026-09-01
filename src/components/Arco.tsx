'use client';

import type { Arco as DatosArco } from '@/lib/datos';
import type { Franja } from '@/lib/cielo';
import { sumarDias, distancia, fechaBonita } from '@/lib/fechas';

/**
 * El arco del tramo, dibujado como lo que es: la trayectoria de un sol.
 *
 * Sustituye a la rejilla estilo GitHub que llevan todos los demás. Cada día es
 * un punto sobre la curva; los cumplidos encienden; el sol marca dónde vas.
 * Ver el sol a un tercio del recorrido dice más que «día 30 de 90».
 */
export default function Arco({
  arco, marcas, hoyStr, total, cielo,
}: {
  arco: DatosArco;
  marcas: DatosArco['marcas'];
  hoyStr: string;
  total: number;
  cielo: Franja;
}) {
  const ANCHO = 600, ALTO = 210;
  const rx = ANCHO / 2 - 26, ry = ALTO - 46;
  const cx = ANCHO / 2, cy = ALTO - 16;

  // Puntos sobre media elipse, de izquierda (θ=π) a derecha (θ=0).
  const punto = (i: number) => {
    const t = arco.dias === 1 ? 0.5 : i / (arco.dias - 1);
    const th = Math.PI * (1 - t);
    return { x: cx + rx * Math.cos(th), y: cy - ry * Math.sin(th) };
  };

  const dias = Array.from({ length: arco.dias }, (_, i) => {
    const d = sumarDias(arco.empieza, i);
    const hechos = (marcas[d] ?? []).length;
    return {
      d, i, hechos,
      lleno: total > 0 && hechos >= total,
      parcial: hechos > 0 && !(total > 0 && hechos >= total),
      futuro: distancia(hoyStr, d) > 0,
      ...punto(i),
    };
  });

  const iHoy = distancia(arco.empieza, hoyStr);
  const dentro = iHoy >= 0 && iHoy < arco.dias;
  const sol = dentro ? punto(iHoy) : null;
  const completos = dias.filter((x) => x.lleno).length;

  // Cuanto más pequeño el punto, más días caben sin amontonarse.
  const r = arco.dias > 180 ? 2.1 : arco.dias > 100 ? 2.6 : 3.2;

  return (
    <section aria-label="Tu arco">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-sm uppercase tracking-wider text-tinta-3">Tu arco</h2>
        <p className="text-sm text-tinta-2 tabular-nums">
          {completos} de {arco.dias}
        </p>
      </div>

      <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className="w-full h-auto"
           role="img"
           aria-label={`${completos} de ${arco.dias} días completos`}>
        <defs>
          <radialGradient id="halo">
            <stop offset="0%" stopColor={cielo.brillo} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* La línea del horizonte: dónde empieza y dónde acaba el tramo. */}
        <line x1={16} y1={cy} x2={ANCHO - 16} y2={cy}
              stroke="currentColor" className="text-linea" strokeWidth="1" />

        {/* La curva completa, tenue: el camino que queda por andar. */}
        <path
          d={`M ${punto(0).x} ${punto(0).y} A ${rx} ${ry} 0 0 1 ${punto(arco.dias - 1).x} ${punto(arco.dias - 1).y}`}
          fill="none" stroke="currentColor" className="text-linea" strokeWidth="1.5"
        />

        {dias.map((p) => (
          <circle
            key={p.d} cx={p.x} cy={p.y}
            r={p.lleno ? r + 0.8 : r}
            className={p.lleno ? 'fill-brasa'
                     : p.parcial ? 'fill-brasa/40'
                     : p.futuro ? 'fill-losa-alta' : 'fill-linea'}
          >
            <title>{`${fechaBonita(p.d)} · ${p.hechos} de ${total}`}</title>
          </circle>
        ))}

        {sol && (
          <g>
            <circle cx={sol.x} cy={sol.y} r={26} fill="url(#halo)" />
            <circle cx={sol.x} cy={sol.y} r={6.5} fill={cielo.sol} />
          </g>
        )}
      </svg>

      <p className="mt-1 text-xs text-tinta-3">
        {dentro
          ? `El sol va por tu día ${iHoy + 1}. Cada punto encendido es un día que cumpliste entero.`
          : 'Tu arco todavía no empieza. El sol saldrá el primer día.'}
      </p>
    </section>
  );
}
