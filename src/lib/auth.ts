import { cookies } from 'next/headers';
import { randomBytes, timingSafeEqual } from 'crypto';
import { sql } from './db';

const COOKIE = 'diauno_sesion';
const VIDA_SESION_DIAS = 60;
const VIDA_ENLACE_MIN = 15;

export type Usuario = { id: string; email: string; nombre: string | null };

const token = (n = 32) => randomBytes(n).toString('base64url');

/** Compara sin filtrar por tiempo cuánto coincide. Paranoia barata. */
function igual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// ─────────────────────────── enlaces de acceso ───────────────────────────
export async function crearEnlace(email: string): Promise<string> {
  const t = token();
  const expira = new Date(Date.now() + VIDA_ENLACE_MIN * 60_000);
  await sql`
    INSERT INTO enlaces (token, email, expira_en)
    VALUES (${t}, ${email.trim().toLowerCase()}, ${expira})`;
  return t;
}

/**
 * Canjea el enlace y deja la sesión abierta. Devuelve null si el token no
 * existe, ya se usó o caducó — sin decir cuál de las tres, que a un atacante
 * no le interesa saberlo.
 */
export async function canjearEnlace(t: string): Promise<Usuario | null> {
  const [fila] = await sql`
    SELECT token, email, multiuso FROM enlaces
    WHERE token = ${t} AND expira_en > now()
      AND (usado_en IS NULL OR multiuso)`;
  if (!fila || !igual(fila.token, t)) return null;

  // Los normales se queman al usarse. Los reutilizables solo anotan la última
  // vez, para poder ver si alguien anda entrando con uno viejo.
  await sql`UPDATE enlaces SET usado_en = now() WHERE token = ${t}`;

  const [usuario] = await sql<Usuario[]>`
    INSERT INTO usuarios (email) VALUES (${fila.email})
    ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
    RETURNING id, email, nombre`;

  await abrirSesion(usuario.id);
  return usuario;
}

// ───────────────────────────────── sesión ────────────────────────────────
async function abrirSesion(usuarioId: string) {
  const id = token(24);
  const expira = new Date(Date.now() + VIDA_SESION_DIAS * 86_400_000);
  await sql`INSERT INTO sesiones (id, usuario_id, expira_en)
            VALUES (${id}, ${usuarioId}, ${expira})`;
  const galletas = await cookies();
  galletas.set(COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expira,
    path: '/',
  });
}

export async function usuarioActual(): Promise<Usuario | null> {
  const galletas = await cookies();
  const id = galletas.get(COOKIE)?.value;
  if (!id) return null;
  const [u] = await sql<Usuario[]>`
    SELECT u.id, u.email, u.nombre
    FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
    WHERE s.id = ${id} AND s.expira_en > now()`;
  return u ?? null;
}

export async function cerrarSesion() {
  const galletas = await cookies();
  const id = galletas.get(COOKIE)?.value;
  if (id) await sql`DELETE FROM sesiones WHERE id = ${id}`;
  galletas.delete(COOKIE);
}

// ───────────────────────────────── correo ────────────────────────────────
/**
 * Sin clave de Resend el enlace se imprime en la consola del servidor. Así se
 * puede desarrollar y probar el flujo entero sin contratar nada; el día que
 * haya clave, esta función empieza a enviar de verdad sin tocar nada más.
 */
export async function enviarEnlace(email: string, url: string) {
  const clave = process.env.RESEND_API_KEY;
  if (!clave) {
    console.log('\n─── enlace de acceso para %s ───\n%s\n', email, url);
    return { enviado: false as const, motivo: 'sin RESEND_API_KEY' };
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${clave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.CORREO_DESDE ?? 'Día Uno <onboarding@resend.dev>',
      to: [email],
      subject: 'Tu acceso a Día Uno',
      text: `Entra aquí y sigue con lo tuyo:\n\n${url}\n\nCaduca en ${VIDA_ENLACE_MIN} minutos.`,
    }),
  });
  return { enviado: r.ok as boolean, motivo: r.ok ? '' : `Resend ${r.status}` };
}
