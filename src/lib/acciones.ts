'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { sql } from './db';
import { crearEnlace, enviarEnlace, usuarioActual, cerrarSesion } from './auth';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_DIA = /^\d{4}-\d{2}-\d{2}$/;

async function origen() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function pedirAcceso(_previo: unknown, datos: FormData) {
  const email = String(datos.get('email') ?? '').trim().toLowerCase();
  if (!RE_EMAIL.test(email)) return { error: 'Ese correo no se ve bien.' };

  const token = await crearEnlace(email);
  const url = `${await origen()}/entrar/${token}`;
  const r = await enviarEnlace(email, url);

  // En desarrollo no hay servicio de correo: devolvemos el enlace para poder
  // seguir. En producción jamás, o cualquiera entraría con el correo de otro.
  return r.enviado
    ? { listo: true as const }
    : { listo: true as const,
        enlace: process.env.NODE_ENV === 'production' ? undefined : url };
}

export async function salir() {
  await cerrarSesion();
  redirect('/');
}

export async function crearArco(_previo: unknown, datos: FormData) {
  const u = await usuarioActual();
  if (!u) return { error: 'Tu sesión caducó. Vuelve a entrar.' };

  const titulo = String(datos.get('titulo') ?? '').trim() || 'Mi arco';
  const empieza = String(datos.get('empieza') ?? '');
  const dias = Number(datos.get('dias') ?? 90);
  const habitos = datos.getAll('habito')
    .map((h) => String(h).trim())
    .filter(Boolean)
    .slice(0, 8);

  if (!RE_DIA.test(empieza)) return { error: 'Elige una fecha de inicio.' };
  if (!Number.isInteger(dias) || dias < 7 || dias > 365)
    return { error: 'La duración va de 7 a 365 días.' };
  if (habitos.length === 0) return { error: 'Añade al menos un hábito.' };

  await sql.begin(async (tx) => {
    await tx`UPDATE arcos SET archivado = true
             WHERE usuario_id = ${u.id} AND NOT archivado`;
    const [arco] = await tx`
      INSERT INTO arcos (usuario_id, titulo, empieza, dias)
      VALUES (${u.id}, ${titulo}, ${empieza}, ${dias}) RETURNING id`;
    for (const [i, nombre] of habitos.entries()) {
      await tx`INSERT INTO habitos (arco_id, nombre, orden)
               VALUES (${arco.id}, ${nombre}, ${i})`;
    }
  });

  revalidatePath('/panel');
  redirect('/panel');
}

/** Marca o desmarca un hábito en un día. El día lo manda el navegador porque
 *  es el suyo el que cuenta, no el del servidor. */
export async function alternarMarca(habitoId: string, dia: string) {
  const u = await usuarioActual();
  if (!u) return { error: 'Sesión caducada' };
  if (!RE_DIA.test(dia)) return { error: 'Día inválido' };

  // Que el hábito sea de un arco suyo. Sin esto, cualquiera con un id ajeno
  // podría marcar en el arco de otro.
  const [ok] = await sql`
    SELECT 1 FROM habitos h JOIN arcos a ON a.id = h.arco_id
    WHERE h.id = ${habitoId} AND a.usuario_id = ${u.id} AND NOT a.archivado`;
  if (!ok) return { error: 'Ese hábito no es tuyo' };

  const borrado = await sql`
    DELETE FROM marcas WHERE habito_id = ${habitoId} AND dia = ${dia} RETURNING 1`;
  if (borrado.length === 0) {
    await sql`INSERT INTO marcas (habito_id, dia) VALUES (${habitoId}, ${dia})
              ON CONFLICT DO NOTHING`;
  }
  revalidatePath('/panel');
  return { marcado: borrado.length === 0 };
}

export async function archivarArco() {
  const u = await usuarioActual();
  if (!u) return;
  await sql`UPDATE arcos SET archivado = true
            WHERE usuario_id = ${u.id} AND NOT archivado`;
  revalidatePath('/panel');
  redirect('/panel');
}
