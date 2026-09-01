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
      <nav className="border-b border-linea">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <span className="font-display text-sm uppercase tracking-[0.2em] text-brasa">
            Día Uno
          </span>
          <div className="flex items-center gap-4 text-sm text-tinta-3">
            <span className="hidden sm:inline">{u.email}</span>
            <form action={archivarArco}>
              <button className="hover:text-tinta-2 transition">Cerrar arco</button>
            </form>
            <form action={salir}>
              <button className="hover:text-tinta-2 transition">Salir</button>
            </form>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-2xl px-6 py-10">
        <Tablero arco={arco} />
      </div>
    </main>
  );
}
