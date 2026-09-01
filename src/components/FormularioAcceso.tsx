'use client';

import { useActionState } from 'react';
import { pedirAcceso } from '@/lib/acciones';

type Estado = { error?: string; listo?: true; enlace?: string } | null;

export default function FormularioAcceso() {
  const [estado, enviar, enviando] = useActionState<Estado, FormData>(
    pedirAcceso, null,
  );

  if (estado?.listo) {
    return (
      <div className="rounded-xl border border-linea bg-losa p-5">
        <p className="font-display text-lg">Revisa tu correo.</p>
        <p className="mt-1 text-tinta-2 text-sm">
          Te mandamos un enlace. Caduca en 15 minutos.
        </p>
        {estado.enlace && (
          <p className="mt-4 text-xs text-tinta-3 break-all">
            Modo desarrollo, sin servicio de correo:{' '}
            <a className="text-hielo underline" href={estado.enlace}>
              entrar directamente
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <form action={enviar} className="flex flex-col sm:flex-row gap-3">
      <input
        type="email"
        name="email"
        required
        autoComplete="email"
        placeholder="tu@correo.com"
        aria-label="Tu correo"
        className="flex-1 rounded-xl border border-linea bg-losa px-4 py-3
                   text-tinta placeholder:text-tinta-3
                   focus:border-hielo focus:outline-none"
      />
      <button
        type="submit"
        disabled={enviando}
        className="rounded-xl bg-brasa px-6 py-3 font-display font-semibold text-noche
                   transition hover:brightness-110 disabled:opacity-60"
      >
        {enviando ? 'Enviando…' : 'Empezar'}
      </button>
      {estado?.error && (
        <p role="alert" className="text-sm text-brasa sm:sr-only">{estado.error}</p>
      )}
    </form>
  );
}
