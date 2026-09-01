'use client';

import { useActionState, useState } from 'react';
import { crearArco } from '@/lib/acciones';
import { hoy, sumarDias, fechaBonita, deDia } from '@/lib/fechas';

const DURACIONES = [30, 60, 90];
const SUGERENCIAS = ['Entrenar', 'Leer 20 min', 'Dormir 8 h', 'Sin pantallas antes de dormir'];

/** El próximo lunes, para quien necesita un principio limpio. */
function proximoLunes(): string {
  const d = deDia(hoy());
  const faltan = (8 - d.getDay()) % 7 || 7;
  return sumarDias(hoy(), faltan);
}

export default function FormularioArco() {
  const [estado, enviar, enviando] = useActionState<{ error?: string } | null, FormData>(
    crearArco, null,
  );
  const [empieza, setEmpieza] = useState(hoy());
  const [dias, setDias] = useState(90);
  const [habitos, setHabitos] = useState<string[]>(['', '', '']);

  const opciones = [
    { valor: hoy(), etiqueta: 'Hoy' },
    { valor: sumarDias(hoy(), 1), etiqueta: 'Mañana' },
    { valor: proximoLunes(), etiqueta: 'El lunes' },
  ];

  return (
    <form action={enviar} className="space-y-8">
      <Campo titulo="Cómo lo llamas">
        <input
          name="titulo"
          defaultValue="Mi arco"
          maxLength={60}
          className="w-full rounded-xl border border-linea bg-losa px-4 py-3
                     focus:border-hielo focus:outline-none"
        />
      </Campo>

      <Campo titulo="Cuándo empieza">
        <div className="flex flex-wrap gap-2">
          {opciones.map((o) => (
            <button
              key={o.valor} type="button" onClick={() => setEmpieza(o.valor)}
              className={`rounded-lg border px-4 py-2 text-sm transition ${
                empieza === o.valor
                  ? 'border-brasa bg-brasa/10 text-brasa'
                  : 'border-linea bg-losa text-tinta-2 hover:bg-losa-alta'}`}
            >
              {o.etiqueta}
            </button>
          ))}
        </div>
        <input
          type="date" name="empieza" value={empieza} min={hoy()}
          onChange={(e) => setEmpieza(e.target.value)}
          aria-label="Fecha de inicio"
          className="mt-3 rounded-xl border border-linea bg-losa px-4 py-2.5
                     text-tinta-2 focus:border-hielo focus:outline-none"
        />
        <p className="mt-2 text-sm text-tinta-3">
          Arrancas el {fechaBonita(empieza)}.
        </p>
      </Campo>

      <Campo titulo="Cuántos días">
        <div className="flex gap-2">
          {DURACIONES.map((d) => (
            <button
              key={d} type="button" onClick={() => setDias(d)}
              className={`flex-1 rounded-lg border px-4 py-3 font-display transition ${
                dias === d
                  ? 'border-brasa bg-brasa/10 text-brasa'
                  : 'border-linea bg-losa text-tinta-2 hover:bg-losa-alta'}`}
            >
              {d}
            </button>
          ))}
        </div>
        <input type="hidden" name="dias" value={dias} />
      </Campo>

      <Campo titulo="Qué vas a sostener">
        <div className="space-y-2">
          {habitos.map((h, i) => (
            <input
              key={i} name="habito" value={h}
              placeholder={SUGERENCIAS[i] ?? 'Otro hábito'}
              maxLength={60}
              onChange={(e) => {
                const c = [...habitos]; c[i] = e.target.value; setHabitos(c);
              }}
              className="w-full rounded-xl border border-linea bg-losa px-4 py-3
                         placeholder:text-tinta-3 focus:border-hielo focus:outline-none"
            />
          ))}
        </div>
        {habitos.length < 6 && (
          <button
            type="button" onClick={() => setHabitos([...habitos, ''])}
            className="mt-2 text-sm text-hielo hover:underline"
          >
            + otro
          </button>
        )}
        <p className="mt-2 text-sm text-tinta-3">
          Pocos y sostenibles. Tres que cumplas valen más que ocho que abandones.
        </p>
      </Campo>

      {estado?.error && (
        <p role="alert" className="text-sm text-brasa">{estado.error}</p>
      )}

      <button
        type="submit" disabled={enviando}
        className="w-full rounded-xl bg-brasa px-6 py-4 font-display font-semibold
                   text-noche transition hover:brightness-110 disabled:opacity-60"
      >
        {enviando ? 'Creando…' : 'Empezar mi arco'}
      </button>
    </form>
  );
}

function Campo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-sm uppercase tracking-wider text-tinta-3">{titulo}</h2>
      {children}
    </div>
  );
}
