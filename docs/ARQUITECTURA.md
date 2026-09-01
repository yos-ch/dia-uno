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

## El cielo y el arco

Los dos componentes que separan a Día Uno del resto del rubro, y no son adorno:
son la misma metáfora del producto.

**El arco es la trayectoria de un sol.** Todos los trackers del mercado dibujan
una rejilla estilo GitHub —hay apps que se llaman literalmente «Habit Heatmap»—.
Aquí el tramo se dibuja como lo que su nombre dice: una curva. Cada día es un
punto; los cumplidos encienden; el sol marca dónde vas. Verlo a un tercio del
recorrido dice más que «día 30 de 90».

**El cielo es tu hora local.** Ocho franjas, de madrugada a noche, con el
degradado del fondo. Dos reglas que no se rompen:

1. Ninguna franja aclara lo suficiente para que el texto blanco deje de leerse.
   Cambia el tono, no el contraste.
2. Ninguna franja es ámbar saturado. El ámbar es SOLO de lo cumplido; si el
   atardecer fuera naranja, el único gesto de color del producto perdería su
   significado. Por eso el atardecer tira a ciruela.

Para revisarlo sin esperar a que anochezca: `/panel?hora=19`.

## El arco se toca

Arrastras el dedo por la curva y los puntos cercanos crecen, tipo dock, con la
ficha del día abriéndose debajo: qué hiciste y qué no, ese día concreto.

Tres decisiones que hacen que se sienta bien:

**Se mapea por ángulo, no por posición horizontal.** Con la x, un píxel cerca
del borde saltaría diez días, porque allí el arco es casi vertical. Con el
ángulo puedes trazar la curva con el dedo y responde parejo de punta a punta.

**Hay que invertir la elipse, no el círculo.** Los puntos se colocan con el
ángulo *paramétrico* de una elipse (`rx ≠ ry`), que no es el ángulo geométrico
desde el centro. Sin dividir por cada radio antes del `atan2`, tocabas el día
22 y respondía el 17. Lo cazó `pruebas/arco.mjs`.

**La lupa solo aparece al tocar.** En reposo el arco se ve limpio; si el bulto
estuviera siempre sobre el día de hoy, parecería un defecto.

El aumento es una campana (`e^-(d/alcance)²`), no un escalón: es lo que hace
que el gesto se sienta continuo en vez de a saltos.

En móvil el arco se peralta (lienzo 420×300 en vez de 620×270) porque con la
proporción de escritorio saldría casi plano en un teléfono.
