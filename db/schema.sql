-- Día Uno · esquema
--
-- Todo en español porque el producto lo es, y así el SQL se lee igual que se
-- habla del producto. Un usuario lleva UN arco a la vez: la idea es el
-- compromiso con un tramo, no una lista infinita de proyectos.

CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

CREATE TABLE IF NOT EXISTS usuarios (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email       citext UNIQUE NOT NULL,
  nombre      text,
  creado_en   timestamptz NOT NULL DEFAULT now()
);

-- Enlaces de acceso de un solo uso. Caducan pronto y se marcan al usarse, para
-- que reenviar el mismo correo no abra dos sesiones.
CREATE TABLE IF NOT EXISTS enlaces (
  token       text PRIMARY KEY,
  email       citext NOT NULL,
  expira_en   timestamptz NOT NULL,
  usado_en    timestamptz,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS enlaces_email_idx ON enlaces (email);

-- Sesiones en tabla y no en JWT: así puedes cerrar sesión de verdad, desde
-- cualquier dispositivo, sin esperar a que caduque un token.
CREATE TABLE IF NOT EXISTS sesiones (
  id          text PRIMARY KEY,
  usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  expira_en   timestamptz NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sesiones_usuario_idx ON sesiones (usuario_id);

-- El arco: un tramo con principio y duración. «empieza» puede ser hoy, mañana
-- o el lunes que viene — esa es toda la idea del producto.
CREATE TABLE IF NOT EXISTS arcos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  titulo      text NOT NULL DEFAULT 'Mi arco',
  empieza     date NOT NULL,
  dias        int  NOT NULL DEFAULT 90 CHECK (dias BETWEEN 7 AND 365),
  archivado   boolean NOT NULL DEFAULT false,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
-- Un solo arco vivo por persona.
CREATE UNIQUE INDEX IF NOT EXISTS arcos_uno_activo
  ON arcos (usuario_id) WHERE NOT archivado;

CREATE TABLE IF NOT EXISTS habitos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  arco_id     uuid NOT NULL REFERENCES arcos(id) ON DELETE CASCADE,
  nombre      text NOT NULL CHECK (length(btrim(nombre)) > 0),
  orden       int  NOT NULL DEFAULT 0,
  creado_en   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS habitos_arco_idx ON habitos (arco_id, orden);

-- Una marca por hábito y día. La unicidad la pone la base, no la aplicación:
-- así dos pestañas abiertas no pueden duplicar el mismo día.
CREATE TABLE IF NOT EXISTS marcas (
  habito_id   uuid NOT NULL REFERENCES habitos(id) ON DELETE CASCADE,
  dia         date NOT NULL,
  creado_en   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (habito_id, dia)
);
CREATE INDEX IF NOT EXISTS marcas_dia_idx ON marcas (dia);
