import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import { arcoDe } from '@/lib/datos';
import { salir, archivarArco } from '@/lib/acciones';
import Tablero from '@/components/Tablero';

export default async function Panel() {
  const u = await usuarioActual();
  if (!u) redirect('/');

  const arco = await arcoDe(u.id);
  if (!arco) redirect('/panel/nuevo');

  return (
    <main className="min-h-dvh">
      <nav className="border-b border-linea/60">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3
                        px-5 py-3 sm:px-6 sm:py-4">
          <span className="font-display text-sm uppercase tracking-[0.2em] text-brasa">
            Día Uno
          </span>
          <div className="flex items-center gap-1 text-sm text-tinta-3 sm:gap-4">
            <span className="hidden md:inline">{u.email}</span>
            {/* Zonas de toque de 44 px: en el teléfono, un enlace de texto suelto
                es imposible de acertar con el pulgar. */}
            <form action={archivarArco}>
              <button className="rounded-lg px-3 py-2.5 transition hover:bg-losa hover:text-tinta-2">
                <span className="sm:hidden">Cerrar</span>
                <span className="hidden sm:inline">Cerrar arco</span>
              </button>
            </form>
            <form action={salir}>
              <button className="rounded-lg px-3 py-2.5 transition hover:bg-losa hover:text-tinta-2">
                Salir
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-6 sm:py-10">
        <Tablero arco={arco} />
      </div>
    </main>
  );
}
