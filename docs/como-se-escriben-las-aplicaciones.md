# Cómo se escriben las aplicaciones de la suite

Escrito el **22 de agosto de 2026**, al ir a empezar la segunda aplicación.

Hay una sola regla, y conviene que quede dicha antes de escribir la primera
línea de Pendientes:

> **`apps/compra` es el modelo. Las demás aplicaciones copian de ella.**

No es una recomendación ni un «inspírate en». Cuando haya duda sobre cómo se
hace algo —cómo se nombra una carpeta, dónde vive una regla, cómo se pinta una
fila, cómo se llama un caso de uso— **la respuesta es mirar la compra y hacer
lo mismo**. Si la compra no lo resuelve, entonces sí hay que decidir, y lo que
se decida se escribe aquí.

**Por qué:** la compra está terminada, publicada y en uso por la familia. Es la
única parte de la suite que ha pasado por la realidad. Lo que allí funciona ya
ha pagado su precio; reinventarlo en la segunda aplicación es volver a pagarlo
sin motivo. Y hay una razón de segundo orden que importa más a medio plazo: si
las aplicaciones se parecen de verdad, dentro de un tiempo se verá qué
comparten y ese será el contenido de `paquetes/` —que hoy está vacío a
propósito, como cuenta [`estado-de-la-suite.md`](estado-de-la-suite.md). Si
cada una se escribe a su manera, no habrá nada que extraer.

---

## 1. Arquitectura limpia, con las capas de la compra

Todas las aplicaciones son **arquitectura limpia**, con las mismas cuatro capas
y los mismos nombres de carpeta en español. La referencia larga —con el porqué
de cada decisión— está en
[`../apps/compra/docs/arquitectura.md`](../apps/compra/docs/arquitectura.md), y
no se repite aquí. En corto:

```
presentacion  ──►  aplicacion  ──►  dominio
      │                                ▲
      └──────►  infraestructura  ───────┘
                (implementa los contratos)
```

| Capa | Qué va dentro |
|---|---|
| `src/dominio/` | `modelo/`, `servicios/`, `contratos/`. No importa nada de las otras capas |
| `src/aplicacion/` | Un caso de uso es una función que recibe `Dependencias` y devuelve la operación enlazada. `construyeCasosDeUso(d)` los reúne |
| `src/infraestructura/` | `memoria/` y `supabase/`, más `contenedor.ts`, **el único sitio donde se elige implementación** |
| `src/presentacion/` | `estilos/`, `estado/`, `componentes/`, `pantallas/`. Las pantallas leen `datos` y llaman a `acciones`; **nunca tocan un repositorio** |

Dos cosas que se copian sin discutir porque son las que sostienen todo lo
demás:

- **Todo caso de uso es asíncrono**, aunque los datos estén en memoria. Es
  justo lo que permite el orden de trabajo del apartado 3.
- **Las dependencias apuntan hacia dentro.** El dominio no sabe que existe
  React ni Supabase.


### Se llaman `contratos`, no `puertos`

Las interfaces que el dominio declara y la infraestructura implementa van en
`dominio/contratos/`.

La compra las llamó `puertos/`, y el nombre despistaba: «puerto» es vocabulario
de arquitectura **hexagonal**, y esto no es hexagonal. La inversión de
dependencias en el borde sí es parte de la arquitectura limpia —los círculos de
dentro declaran lo que necesitan y los de fuera lo implementan—, pero lo que
ordena el proyecto son las **capas concéntricas**, no una simetría de puertos
alrededor de un núcleo. `contratos` dice lo que la cosa es sin traer prestada
media teoría de otro sitio.

**Pendiente:** la compra todavía tiene `src/dominio/puertos/`. Hay que
renombrarlo para que las dos aplicaciones digan lo mismo — es justo el caso del
apartado 5, la divergencia que no puede quedarse callada.

## 2. El sistema visual también se copia

`apps/compra/src/presentacion/estilos/tokens.css` es el sistema visual de la
suite, no el de la compra. Se copia **tal cual**, sin retocar valores: los
mismos colores, la misma escala tipográfica (10 / 11 / 12 / 13), los mismos
temas claro y oscuro.

La anatomía de los componentes va con él —cabecera, botones de 44×44, barra de
pestañas de 62 px, tarjeta de fila de 72 px, diálogo pegado arriba, iconos
Lucide a `stroke-width: 1.75`. El apartado 2 de
[`pendientes-boceto.md`](pendientes-boceto.md) los tiene medidos uno a uno.

**Un boceto de Claude Design no manda sobre esto.** Los bocetos aciertan la
forma y se inventan los valores —el de Pendientes se inventó el tema oscuro
entero y sacó un tamaño de 11,5 px que no existe en la escala. Cuando el boceto
y `tokens.css` no coincidan, gana `tokens.css`.

## 3. El orden de trabajo: pantallas contra memoria, y después Supabase

Una aplicación nueva se escribe en dos tiempos, y este orden es deliberado.

**Primero las pantallas, contra los repositorios en memoria.** Se escribe el
dominio, los contratos y una implementación `memoria/` con datos de ejemplo —una
semilla realista, de una casa de verdad, como la de la compra— y se monta la
interfaz entera contra eso. Sin red, sin credenciales, sin tabla creada. La
compra ya trae el arranque preparado: `--mode memoria` deja las dos variables
de Supabase vacías, `haySupabase` sale falso y `contenedor.ts` monta la
implementación en memoria; la autenticación simulada acepta cualquier correo
con «@».

**Después los casos de uso contra Supabase.** Con la interfaz ya de pie y las
formas de los datos asentadas por el uso, se escribe la migración en
`supabase/` —numeración de la suite, siguiendo donde iba— y la implementación
`supabase/` de los mismos contratos. La presentación no se toca.

**Por qué en este orden:** las pantallas son las que descubren qué datos hacen
falta de verdad, y descubrirlo es barato mientras el almacén es un objeto en
memoria y carísimo cuando ya es una tabla con migración escrita. Al pasar a
Supabase no debería cambiar ni un caso de uso ni una pantalla: si cambia
alguno, es señal de que algo se coló de la capa de fuera hacia dentro.

El modo memoria no es un andamio que se tira al terminar. Se queda: es como se
mira la interfaz sin credenciales y como se prueba sin ensuciar los datos de la
familia. Cada aplicación lleva sus tres entradas en
[`../.claude/launch.json`](../.claude/launch.json) —normal, compilada y en
memoria— igual que la compra.

## 4. Lo que sí es propio de cada aplicación

Copiar la forma no es copiar el contenido. De cada aplicación es suyo:

- Su modelo y sus reglas. Pendientes tiene cuatro campos —título, comentario,
  fecha de creación, fecha de realización— y no le hacen falta las unidades ni
  el redondeo a milésimas de la compra.
- Sus pantallas y su navegación.
- Sus tablas, en el `supabase/` común pero con sus nombres.
- Su documento de estado, dentro de su carpeta, como
  `apps/compra/docs/estado-del-proyecto.md`.

## 5. Cuando la compra se equivoque

Puede pasar: la compra es el modelo, no el evangelio. Si al escribir la segunda
aplicación se ve una forma claramente mejor, se cambia —pero entonces **se
cambia también en la compra**, o al menos se anota aquí que hay dos formas y
cuál gana. Lo que no puede quedar es la divergencia callada, que es
exactamente lo que impide que `paquetes/` llegue a existir algún día.
