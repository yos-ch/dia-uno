import { NextRequest, NextResponse } from 'next/server';
import { canjearEnlace } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const usuario = await canjearEnlace(token);
  // Un enlace caducado o ya usado devuelve a la portada con un aviso, nunca a
  // una pantalla de error: casi siempre es alguien que abrió el correo tarde.
  const destino = usuario ? '/panel' : '/?caducado=1';
  return NextResponse.redirect(new URL(destino, req.url));
}
