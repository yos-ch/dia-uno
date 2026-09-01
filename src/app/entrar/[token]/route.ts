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
  const destino = usuario ? seguro : '/?caducado=1';

  // Detrás de un proxy —ngrok, Cloudflare, un balanceador— req.url trae el host
  // INTERNO. Si redirigimos con él, el teléfono acaba en localhost:3411 y el
  // acceso parece roto aunque haya funcionado. Hay que mirar las cabeceras.
  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
  const proto = req.headers.get('x-forwarded-proto')
    ?? (host?.startsWith('localhost') ? 'http' : 'https');
  const base = host ? `${proto}://${host}` : req.url;

  return NextResponse.redirect(new URL(destino, base));
}
