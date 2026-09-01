import postgres from 'postgres';

/**
 * Una sola conexión para toda la app. En desarrollo Next recarga los módulos en
 * caliente, así que la guardamos en el objeto global: sin esto, cada cambio de
 * archivo abriría un pool nuevo y en media hora agotas las conexiones de
 * Postgres.
 */
const cache = globalThis as unknown as { sql?: ReturnType<typeof postgres> };

function crear() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('Falta DATABASE_URL. Copia .env.example a .env.local.');
  return postgres(url, {
    max: 10,
    idle_timeout: 20,
    // Neon y Supabase exigen TLS; en local no hay.
    ssl: url.includes('localhost') || url.includes('127.0.0.1') ? false : 'require',
  });
}

export const sql = cache.sql ?? crear();
if (process.env.NODE_ENV !== 'production') cache.sql = sql;
