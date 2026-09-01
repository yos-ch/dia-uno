# Arquitectura

Next 16 (App Router) + Postgres. Sin backend aparte: los *server actions* y los
*route handlers* de Next hacen ese papel. Se valoró FastAPI —el stack habitual
de la casa— y se descartó para la v1: son dos despliegues, CORS y migraciones
para una app que cabe en uno. Si algún día hace falta, el modelo de datos ya
está en SQL plano y se lleva tal cual.

```
src/
  app/
    page.tsx                 portada y captación
    entrar/[token]/route.ts  canje del enlace de acceso
    panel/page.tsx           el tablero (servidor)
    panel/nuevo/page.tsx     alta del arco
  components/
    Tablero.tsx              el día, los hábitos y la rejilla (cliente)
    FormularioArco.tsx       alta (cliente)
    FormularioAcceso.tsx     pedir enlace (cliente)
  lib/
    db.ts        una sola conexión, cacheada entre recargas de Next
    auth.ts      enlaces de un uso y sesiones en tabla
    acciones.ts  server actions, con la validación
    datos.ts     lecturas
    fechas.ts    aritmética de días (probada aparte)
db/schema.sql
```

## Autenticación

Enlace de un solo uso por correo, sin contraseñas. El token caduca a los 15
minutos y se marca al usarse.

Las sesiones viven en una tabla, no en un JWT. Cuesta una consulta por petición
y a cambio «cerrar sesión» cierra de verdad, desde cualquier dispositivo, sin
esperar a que caduque nada.

## Autorización

Toda acción que escribe comprueba que la fila sea de quien la pide. `alternarMarca`
no se fía del `habitoId` que llega del cliente: verifica antes que ese hábito
cuelgue de un arco del usuario en sesión.

## Qué falta para producción

- Poner `DATABASE_URL` de Neon o Supabase. El cliente ya activa TLS solo cuando
  el host no es local.
- Poner `RESEND_API_KEY` para que salgan los correos de verdad.
- Limitar la petición de enlaces por IP y por correo. Hoy nada impide pedir mil.
