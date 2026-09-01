# Modelo de datos

Seis tablas. El esquema vive en [`db/schema.sql`](../db/schema.sql) y es la
fuente de verdad; aquí solo se explica el porqué.

| tabla | para qué |
|---|---|
| `usuarios` | quién eres. Solo correo, nada más. |
| `enlaces` | accesos de un uso, con caducidad. |
| `sesiones` | sesiones abiertas, revocables. |
| `arcos` | el tramo: cuándo empieza y cuántos días dura. |
| `habitos` | lo que vas a sostener durante ese arco. |
| `marcas` | un hábito cumplido un día concreto. |

## Reglas que impone la base, no el código

**Un arco vivo por persona.** Índice único parcial sobre `usuario_id` donde
`NOT archivado`. Si la aplicación intentara crear dos, la base lo impide.

**Una marca por hábito y día.** Clave primaria compuesta `(habito_id, dia)`.
Dos pestañas abiertas no pueden duplicar el mismo día.

## Fechas, no instantes

`arcos.empieza` y `marcas.dia` son `date`, sin zona horaria. El producto se mide
en días del calendario de quien lo usa: si marcas a las 23:50 en México, ese día
es el tuyo. Guardar `timestamptz` obligaría a convertir en cada lectura y
abriría la puerta a que un cambio de horario partiera una racha.
