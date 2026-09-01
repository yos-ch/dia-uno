import { sql } from './db';

export type Habito = { id: string; nombre: string; orden: number };
export type Arco = {
  id: string;
  titulo: string;
  empieza: string;     // YYYY-MM-DD
  dias: number;
  habitos: Habito[];
  marcas: Record<string, string[]>;   // dia -> habitoId[]
};

/** El arco vivo de alguien, con sus hábitos y todo lo ya marcado. */
export async function arcoDe(usuarioId: string): Promise<Arco | null> {
  type Fila = { id: string; titulo: string; empieza: string; dias: number };
  const [arco] = await sql<Fila[]>`
    SELECT id, titulo, to_char(empieza, 'YYYY-MM-DD') AS empieza, dias
    FROM arcos WHERE usuario_id = ${usuarioId} AND NOT archivado`;
  if (!arco) return null;

  const habitos = await sql<Habito[]>`
    SELECT id, nombre, orden FROM habitos
    WHERE arco_id = ${arco.id} ORDER BY orden, creado_en`;

  const filas = await sql<{ habito_id: string; dia: string }[]>`
    SELECT m.habito_id, to_char(m.dia, 'YYYY-MM-DD') AS dia
    FROM marcas m JOIN habitos h ON h.id = m.habito_id
    WHERE h.arco_id = ${arco.id}`;

  const marcas: Record<string, string[]> = {};
  for (const f of filas) (marcas[f.dia] ??= []).push(f.habito_id);

  return { ...arco, habitos: [...habitos], marcas };
}
