import { NextRequest, NextResponse } from 'next/server';
import { canjearEnlace } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const usuario = await canjearEnlace(token);

  // A dónde ibas antes de que te pidiéramos entrar. Solo rutas de esta app:
  // aceptar una URL completa aquí sería un redirector abierto de manual.
  const pedido = req.nextUrl.searchParams.get('siguiente');
  const seguro = pedido && pedido.startsWith('/') && !pedido.startsWith('//')
    ? pedido : '/panel';

  // Un enlace caducado o ya usado devuelve a la portada con un aviso, nunca a
  // una pantalla de error: casi siempre es alguien que abrió el correo tarde.
  return NextResponse.redirect(new URL(usuario ? seguro : '/?caducado=1', req.url));
}
