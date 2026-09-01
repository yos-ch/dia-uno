import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import FormularioArco from '@/components/FormularioArco';

export default async function Nuevo() {
  const u = await usuarioActual();
  if (!u) redirect('/');
  return (
    <main className="min-h-dvh">
      <div className="mx-auto max-w-xl px-6 py-14">
        <p className="font-display text-sm uppercase tracking-[0.2em] text-brasa">
          Día Uno
        </p>
        <h1 className="font-display text-4xl font-bold mt-3 text-balance">
          ¿Cuándo empieza el tuyo?
        </h1>
        <p className="mt-3 text-tinta-2">
          No hace falta esperar a un lunes ni a enero. El arco empieza el día
          que tú pongas aquí.
        </p>
        <div className="mt-10">
          <FormularioArco />
        </div>
      </div>
    </main>
  );
}
