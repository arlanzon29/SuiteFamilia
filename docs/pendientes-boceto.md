# Pendientes: lectura del boceto

Fecha: **22 de agosto de 2026**.

El boceto de la segunda aplicación de la suite está en
[`Pendientes.html`](Pendientes.html), hecho con Claude Design. Este documento
es lo que se vio al leerlo por dentro: qué respeta, qué hay que corregir al
pasarlo a React y qué se decidió sobre lo que dejaba abierto. Se escribe ahora
para que no haya que volver a leer las nueve pantallas cuando toque programar.

---

## 1. Qué hay

Nueve pantallas de 375×812, todas con tema claro y oscuro:

| | Pantalla | Qué muestra |
|---|---|---|
| 01 | Lista | Los pendientes por hacer, en tarjetas, y el botón de crear |
| 02 | Ficha | Un pendiente entero: título, las dos fechas, el comentario largo |
| 03 | Nuevo | La lista con el diálogo de crear encima |
| 04 | Vacío | La lista sin nada apuntado |
| 05 | Acceso | Correo y contraseña — la misma cuenta que la compra |
| 06 | Ajustes | Tema, cuenta, aplicaciones de la suite, desconectar |
| 07 | Editar | La ficha con el diálogo de editar encima |
| 08 | Inicio | Saludo, fecha y lo más antiguo sin hacer |
| 09 | Hechos | Lo resuelto, agrupado por mes |

Se pidieron cuatro (lista, ficha, diálogo, vacío); las otras cinco las añadió
Design por su cuenta, siguiendo la forma que ya tiene la compra.

El modelo de datos que dibuja es exactamente el que se quería, sin inventarse
campos: **título, comentario largo, fecha de creación y fecha de realización**.
Ni prioridades, ni etiquetas, ni personas asignadas.

## 2. Lo que respeta, y por eso no hay que rehacerlo

Los valores están copiados del sistema visual, no aproximados a ojo. Coinciden
con [`apps/compra/src/presentacion/estilos/tokens.css`](../apps/compra/src/presentacion/estilos/tokens.css)
y con la anatomía real de los componentes de la compra:

- Cabecera con `padding: 14px 14px 12px` y filete de 1 px abajo; kicker de
  10 px con `letter-spacing: .14em` y título en Cormorant 600 a 24 px.
- Botones cuadrados de 44×44 con borde, a los lados de la cabecera.
- Barra de pestañas de 62 px por pestaña, icono de 22 px sobre etiqueta de
  11 px, la activa en oro sobre `--color-accent-100`.
- Tarjeta de fila de 72 px mínimo con `padding: 16px 14px`, título en
  Cormorant 600 a 19 px y línea secundaria de 12 px en `--color-neutral-600`.
- Botón destacado de 52 px con tinte `--color-accent-100` y borde oro.
- Diálogo pegado arriba, no centrado.
- Iconos SVG con geometría Lucide en rejilla de 24 y `stroke-width: 1.75`.
- Contenido español realista, de una casa de verdad. Sin relleno ni emoji.
- No dibuja barra de estado del móvil ni teclado falso.

## 3. Qué corregir al pasarlo a React

**El tema oscuro no es el de la suite.** Se lo inventó, y además incompleto:
le faltan casi todos los neutros y los acentos intermedios.

| | El boceto | La suite |
|---|---|---|
| `--color-bg` | `#1b1a18` | `#191817` |
| `--color-surface` | `#262421` | `#232120` |
| `--color-text` | `#efeae2` | `#efece7` |
| `--color-accent` | `#d7a45b` | `#dcaf68` |

Al portar se usa `tokens.css` tal cual y el bloque del boceto se tira entero.

**Aparece un tamaño de 11.5 px** en «hace 18 días» (pantalla 08) y en
«4 pendientes resueltos este mes» (pantalla 09). La escala de la aplicación no
tiene ese tamaño: va 10 / 11 / 12 / 13. Se cuadra a 12.

**Falta el hueco de la barra de gestos.** La barra de pestañas necesita
`padding-bottom: env(safe-area-inset-bottom)` — la clase `.barra-segura` de la
compra. En un marco de 812 px no se ve el fallo; en un móvil real, sí.

**El comentario largo va justificado** con `text-align: justify` y
`hyphens: auto`. En una columna de 347 px eso abre ríos de blanco. Se entiende
la intención editorial, pero conviene dejarlo alineado a la izquierda.

**El kicker dice literalmente «Suitefamilia»**, en minúsculas, y solo se ve
bien por el `text-transform: uppercase`. Cosmético.

## 4. Lo que se decidió

El boceto no resolvía cuatro cosas, y son decisiones de producto: marcan cómo
se escribe el dominio. Quedaron cerradas el 22 de agosto de 2026.

**Los pendientes se pueden borrar.** Uno apuntado por error no debe quedarse en
«Hechos» fingiendo que se hizo. Va como acción secundaria **dentro de la
ficha**, nunca en la fila de la lista, para que no se borre de un roce. Es
además el gesto que la suite ya conoce: la compra tiene `borrar` en artículos y
en supermercados.

**Un «hecho» se puede deshacer.** Marcar hecho es un gesto de un toque y
equivocarse es fácil. En datos no cuesta nada —es poner la fecha de realización
a nulo— y es lo que ya hace la compra al reabrir una lista cerrada.

**Se quedan las cuatro pestañas** del boceto: Inicio, Pendientes, Hechos y
Ajustes. Es la duda que más se discutió, porque Inicio aquí no resume cuentas
hechas en el servidor como en la compra; se mantiene igualmente, y las cuatro
pantallas ya están dibujadas.

**Fuera las filas de «Aplicaciones de la suite» de Ajustes.** Parecían
navegación y no llevaban a ningún sitio. Ajustes se queda con tema, cuenta y
desconectar.

De la última sale un flanco abierto que no es de esta aplicación: al quitarlas
**no queda ninguna forma de saltar de una aplicación a otra desde dentro**.
Cada una se abre por su dirección o por su icono instalado. Eso empuja hacia
poner portada en `/SuiteFamilia/`, que hoy da 404 y ya figuraba entre lo que
queda por decidir en [`estado-de-la-suite.md`](estado-de-la-suite.md). No
bloquea nada de Pendientes.

## 5. Cómo se lee el fichero por dentro

`Pendientes.html` no es HTML plano: es un empaquetado de Design de unos
600 KB, y casi todo el peso son las fuentes incrustadas en base64. Abrirlo en
el navegador funciona, pero para portarlo hace falta el código fuente.

Dentro hay dos etiquetas `<script>` con JSON: una de tipo
`__bundler/manifest` —los recursos comprimidos: la letra, el motor— y otra de
tipo `__bundler/template`, que es **la página entera como una cadena JSON**.

Eso ya está hecho y guardado: el marcado real está en
[`Pendientes-fuente.html`](Pendientes-fuente.html), 102 KB legibles con las
nueve pantallas marcadas por `data-screen-label`, y lo saca
[`../scripts/extrae-boceto.mjs`](../scripts/extrae-boceto.mjs):

```bash
node scripts/extrae-boceto.mjs docs/Pendientes.html
```

Lo que sale **no se puede abrir en el navegador** —las fuentes y el motor
apuntan a recursos del empaquetado por identificador—, y no hace falta: es
para leerlo. Dentro es un componente `<x-dc>` con los estilos en línea, un
tablero de 375×812 por pantalla y, al final, un `<script data-dc-script>` con
la lógica del cambio de tema.

Dos rarezas del marcado, que conviene saber antes de copiar nada de ahí:

- **Los atributos en camelCase van escapados.** `viewBox` aparece como
  `sc-camel-view-box` (57 veces, en los iconos) y `onClick` como
  `sc-camel-on-click` (10). Al portar se devuelven a su forma.
- **Los `{{ ... }}` son enlaces del motor de Design**, casi todos del tema. En
  React se sustituyen por estado de verdad: en la compra, `useTema`.

Es la vía a seguir con los bocetos que vengan: se lee el fuente, no se
reconstruye desde una captura.

## 6. El nombre

En [`estado-de-la-suite.md`](estado-de-la-suite.md) esta aplicación figuraba
como `tareas`, en `/SuiteFamilia/tareas/`. Se llama **Pendientes**, y su
dirección será `/SuiteFamilia/pendientes/`. Queda por cambiar cuando se cree
la carpeta `apps/pendientes` y su entrada en el flujo de despliegue.
