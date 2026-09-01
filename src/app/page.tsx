import { redirect } from 'next/navigation';
import { usuarioActual } from '@/lib/auth';
import FormularioAcceso from '@/components/FormularioAcceso';

export default async function Portada() {
  if (await usuarioActual()) redirect('/panel');

  return (
    <main className="min-h-dvh flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl">
          <p className="font-display text-brasa text-sm tracking-[0.2em] uppercase mb-8">
            Día Uno
          </p>

          <h1 className="font-display text-5xl sm:text-6xl font-bold leading-[1.02] text-balance">
            Tu arco no empieza
            <br />
            en invierno.
          </h1>

          <p className="mt-6 text-lg text-tinta-2 leading-relaxed max-w-md">
            Empieza el día que decides ser tu mejor versión. Puede ser hoy, el
            lunes, o el primero de enero. Tú pones la fecha; nosotros contamos
            los días.
          </p>

          <div className="mt-10">
            <FormularioAcceso />
          </div>

          <p className="mt-6 text-sm text-tinta-3">
            Sin contraseñas. Te mandamos un enlace y entras.
          </p>
        </div>
      </div>

      <footer className="px-6 py-8 text-sm text-tinta-3 border-t border-linea">
        <div className="max-w-xl mx-auto flex flex-wrap gap-x-6 gap-y-2">
          <span>Elige tus hábitos.</span>
          <span>Marca cada día.</span>
          <span className="text-tinta-2">No rompas la racha.</span>
        </div>
      </footer>
    </main>
  );
}
