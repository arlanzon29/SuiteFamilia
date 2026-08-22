# Estado del proyecto

Última actualización: **22 de agosto de 2026**.

Lo último: **Pendientes existe**. Las nueve pantallas del boceto están
escritas en React con las cuatro capas de la compra, corriendo contra
repositorios en memoria con una semilla realista. No hay nada de Supabase
todavía —ni migración, ni implementación—: ese es el paso siguiente, y es
deliberado que vaya después.

> **Lo que queda por comprobar de verdad.** La aplicación compila, pasa
> `tsc --noEmit` y arranca, y se han visto **dos** pantallas en el navegador:
> Acceso e Inicio, en tema claro. Las otras siete **no se han mirado**, ni en
> claro ni en oscuro: la herramienta de clicks del navegador se colgaba en cada
> pulsación y no se pudo recorrer la aplicación. Está en §5, con lo que hay que
> hacer exactamente.

Este documento cuenta lo de dentro de esta aplicación. Lo que afecta a la suite
entera va en [`../../../docs/estado-de-la-suite.md`](../../../docs/estado-de-la-suite.md).

---

## 1. Dónde estamos

| | Qué | Estado |
|---|---|---|
| Dominio, casos de uso, infraestructura en memoria | escrito | ✅ |
| Las nueve pantallas | escritas | ✅ |
| `tsc --noEmit` | limpio | ✅ |
| Arranque en modo memoria | arranca y pinta | ✅ |
| Recorrido de las nueve pantallas, claro y oscuro | **sin hacer** | ⬜ |
| Migración y repositorios de Supabase | **sin empezar**, es lo siguiente | ⬜ |
| Entrada en el flujo de despliegue | **sin hacer**, y a propósito | ⬜ |

No está en el despliegue porque no tiene sentido publicar algo que solo
funciona contra memoria: lo publicado enseñaría la semilla y perdería lo
escrito al recargar. Por eso el `build` del `package.json` de la raíz **sigue
compilando solo la compra**, a diferencia de `instalar` y `typecheck`, que ya
recorren las dos. Añadir Pendientes al `build` es lo mismo que publicarla: el
flujo de GitHub Actions sube la carpeta `dist` entera.

## 2. Cómo arrancarla

Desde la raíz de la suite:

```
npm install --prefix apps/pendientes
npm run dev --prefix apps/pendientes -- --port 5174
```

Las tres entradas de arranque están en
[`../../../.claude/launch.json`](../../../.claude/launch.json), con puertos que
no chocan con los de la compra:

| Entrada | Puerto | Qué hace |
|---|---|---|
| `pendientes` | 5174 | servidor de desarrollo |
| `pendientes-compilada` | 4174 | sirve lo ya compilado |
| `pendientes-memoria` | 5200 | desarrollo con `--mode memoria` |

**Hoy las tres hacen lo mismo**, y conviene saberlo: `--mode memoria` en la
compra vacía las dos variables de Supabase para que `haySupabase` salga falso;
aquí no hay Supabase que apagar, así que el modo no cambia nada. La entrada se
crea ya porque es la que empezará a distinguir en cuanto entren los
repositorios de verdad, y porque las tres entradas por aplicación son la forma
de la suite.

Se entra con cualquier correo que lleve «@» y cualquier contraseña: la
autenticación es simulada, la misma que la de la compra sin `.env`.

## 3. Las capas

Arquitectura limpia, las cuatro capas de la compra, dependencias hacia dentro.
La referencia larga —con el porqué de cada decisión— está en
[`../../compra/docs/arquitectura.md`](../../compra/docs/arquitectura.md) y no se
repite aquí.

```
presentacion  ──►  aplicacion  ──►  dominio
      │                                ▲
      └──────►  infraestructura  ───────┘
                (implementa los contratos)
```

### `dominio/`

`modelo/pendiente.ts` es todo el modelo, y son **cuatro campos**:

```ts
type Pendiente = {
  id: string
  titulo: string          // una línea
  comentario: string      // puede estar vacío
  creado: string          // ISO con zona
  hecho: string | null    // ISO con zona; nulo mientras esté por hacer
}
```

Sin prioridades, sin etiquetas, sin personas asignadas. Y `hecho` es toda la
máquina de estados que hay: nulo es «por hacer», con fecha es «hecho», y
deshacer es volver a ponerlo a nulo. Por eso no existe ningún booleano aparte
que pudiera contradecir a la fecha.

Las dos fechas son **instantes**, no días, y van en ISO completo con zona por lo
mismo que `Lista.creada` en la compra: cortar el ISO por la `T` da el día en
UTC, que a partir de las diez de la noche en España ya es el de mañana. El día
se calcula en la pantalla, en la zona de quien mira. Todo lo que cuenta días
pasa por `presentacion/formato.ts`, que lo hace a mediodía para que el cambio de
hora no mueva una resta.

`servicios/agrupacion.ts` tiene lo único que no es trivial: agrupar lo hecho por
el mes en que se resolvió, en local y no en UTC por el mismo motivo.

### `dominio/contratos/`, y no `puertos/`

Las interfaces del dominio van en **`contratos/`**. La compra las llama
`puertos/` y está pendiente de renombrar; el porqué está en
[`../../../docs/como-se-escriben-las-aplicaciones.md`](../../../docs/como-se-escriben-las-aplicaciones.md).
Son tres:

```ts
interface RepositorioPendientes { listar, obtener, crear, editar, marcarHecho, borrar }
interface ServicioAutenticacion { sesionActual, entrar, salir }
interface Reloj { hoy }
```

Contratos que la implementación de Supabase tendrá que respetar, porque son
reglas y no detalles de almacenamiento:

- **`marcarHecho` es idempotente**: si el pendiente ya no está, no hace nada en
  vez de fallar. La aplicación la usan dos personas y la otra puede haberlo
  borrado entre medias. Es la misma regla que los tres métodos estrechos de
  `RepositorioListas` en la compra.
- **`editar` toca título y comentario, y solo eso.** Las dos fechas no se
  editan a mano: son el registro de cuándo pasó algo.
- **Las fechas las pone el almacén, nunca quien llama.** En memoria es
  `new Date()`; contra Supabase será `now()` del servidor, que además evita que
  el reloj torcido de un móvil ordene mal la lista de la otra persona.

`marcarHecho` va aparte de `editar` por lo mismo que en la compra
`marcarComprado` va aparte de `guardarItems`: se toca con un dedo desde la
ficha, quien llama ya sabe el estado que quiere dejar, y pasarlo por `editar`
obligaría a mandar además el título y el comentario, con el riesgo de pisarlos.

### `aplicacion/`

Ocho casos de uso, **todos asíncronos** aunque los datos estén en memoria. Es
justo lo que permite que Supabase entre después sin tocar ni una pantalla.

El recorte del texto (`titulo.trim()`, y sin título no se crea nada) vive aquí y
no en la pantalla ni en el repositorio: «un título en blanco no es un pendiente»
es una regla de la aplicación, no un detalle de la caja de texto ni de la tabla.

### `infraestructura/`

`contenedor.ts` es el único sitio donde se elige implementación, y hoy solo hay
una. **No lleva todavía la comprobación de `.env` de la compra**: mientras no
exista la implementación de Supabase, elegir entre dos no es una decisión sino
un `if` que siempre cae del mismo lado. Entrará con ella.

`memoria/semilla.ts` trae once pendientes —cinco por hacer, seis resueltos— con
contenido de una casa de verdad: la caldera, el filtro del extractor, la ITV, la
persiana, el detector de humo. Los cuatro primeros y los ejemplos de «hechos»
salen del boceto, que ya los traía buenos.

**Las fechas de la semilla son relativas al día en que se arranca**, no fijas
como las de la compra. Aquí media interfaz habla de tiempo —«anotado ayer»,
«hace 18 días», los meses de Hechos—, y con fechas fijas la semilla envejece: a
los tres meses todo saldría como «hace 100 días» y no se podría revisar el
diseño de nada. Los dos resueltos más antiguos caen a propósito en el mes
anterior, para que se vea que Hechos agrupa por meses de verdad.

### `presentacion/`

`AppProvider` es el contexto único. Las pantallas leen `datos` y llaman a
`acciones`; **nunca tocan un repositorio**.

Aquí **no** está la carga perezosa de la compra ni su segunda petición de
resumen, y no es un descuido: allí Inicio se apaña con tres cuentas hechas en el
servidor y la instantánea completa arrastra el histórico entero de precios.
Esto es una tabla de una casa, y las cuatro pantallas —Inicio la primera— leen
de ella. Partirla en dos peticiones sería complicar el código para ahorrar una
consulta que no pesa. Si algún día pesa, el sitio donde arreglarlo es este y
solo este.

## 4. Las nueve pantallas

| Boceto | Dónde vive |
|---|---|
| 01 Lista | `pantallas/Pendientes.tsx` |
| 02 Ficha | `pantallas/Ficha.tsx` |
| 03 Nuevo | `componentes/DialogoApp.tsx`, tipo `nuevo` |
| 04 Vacío | dentro de `Pendientes.tsx` |
| 05 Acceso | `pantallas/Login.tsx` |
| 06 Ajustes | `pantallas/Ajustes.tsx` |
| 07 Editar | `componentes/DialogoApp.tsx`, tipo `editar` |
| 08 Inicio | `pantallas/Inicio.tsx` |
| 09 Hechos | `pantallas/Hechos.tsx` |

El vacío va **dentro** de la lista y no en un fichero aparte porque es la misma
pantalla en otro momento: separarlo obligaría a que algo de fuera decidiera
cuál pintar, y esa decisión es de la lista.

### Las cuatro decisiones de producto, ya en el código

- **Se pueden borrar.** Acción secundaria **dentro de la ficha**, en voz baja y
  con confirmación detrás. Nunca en la fila de la lista: en una lista que se
  recorre con el pulgar, un botón de borrar al lado del texto se dispara solo.
- **Un «hecho» se puede deshacer.** El mismo botón grande de la ficha cambia de
  cara: «Darlo por hecho» sobre tinte oro cuando está por hacer, «Volver a
  dejarlo pendiente» en secundario cuando ya está hecho.
- **Cuatro pestañas**: Inicio, Pendientes, Hechos, Ajustes.
- **En Ajustes solo tema, cuenta y desconectar.** Fuera las filas de
  «Aplicaciones de la suite» del boceto. De ahí sale un flanco que **no es de
  esta aplicación**: ya no queda forma de saltar de una aplicación a otra desde
  dentro, lo que empuja hacia poner portada en `/SuiteFamilia/`. Anotado en el
  documento de la suite.

### Las seis correcciones al boceto, hechas

1. **El tema oscuro del boceto se tiró entero.** `tokens.css` está copiado de la
   compra **byte a byte** —comprobado con `cmp`—, sin retocar un solo valor.
2. **El 11,5 px no existe**: la escala va 10 / 11 / 12 / 13. Los dos sitios que
   lo llevaban —«hace 18 días» de Inicio y «4 pendientes resueltos este mes» de
   Hechos— están a 12.
3. **La barra de pestañas lleva `.barra-segura`**, que le reserva
   `env(safe-area-inset-bottom)`. En un marco de 812 px no se ve el fallo; en un
   móvil real la barra de gestos se come la fila de abajo.
4. **Fuera el `text-align: justify`** del comentario largo. En una columna de
   347 px abría ríos de blanco.
5. **El kicker se escribe «SuiteFamilia»**, con las dos mayúsculas.
6. **Los atributos escapados vuelven a su forma**: `sc-camel-view-box` es
   `viewBox` y `sc-camel-on-click` es `onClick`. En la práctica no se copió ni
   un SVG del boceto: los iconos que ya existían en la compra se traen de allí
   —la casa de la barra de pestañas tiene que ser la misma casa en las dos
   aplicaciones— y los nuevos se dibujan con geometría Lucide en rejilla de 24,
   como manda `iconos.tsx`.

### Dos cosas del boceto que no se portaron

- **El enlace «¿No te acuerdas de la contraseña? Cámbiala aquí»** de la pantalla
  de Acceso. No lleva a ningún sitio y no hay recuperación de contraseña
  escrita; la compra tampoco lo tiene. Cuando la haya, entra en las dos.
- **«Sesión iniciada el 14/08/2026»** en Ajustes. El servicio de autenticación
  no guarda esa fecha y no merece un campo nuevo para una línea informativa.

### Y una que se añadió

Inicio enseña **hasta cinco** de los más antiguos sin hacer, no dos como el
boceto, y debajo un «Ver los N pendientes» cuando hay más. Con dos, la pantalla
quedaba medio vacía en un móvil de 812 px.

## 5. Lo que hay que comprobar antes de dar esto por bueno

No se ha recorrido la aplicación en el navegador. **Nada de lo de abajo está
verificado**, más allá de que Acceso e Inicio se pintan bien en claro.

El recorrido, en orden, en `pendientes-memoria` y a 375×812:

1. **Acceso** → entrar con cualquier correo con «@».
2. **Inicio**: saludo, fecha larga, los cinco más antiguos con «hace N días».
3. **Pendientes**: cinco filas, la más antigua arriba; la línea secundaria
   recorta a dos renglones.
4. **Nuevo**: el diálogo pegado arriba; guardar y ver la fila aparecer.
5. **Ficha**: las dos fechas enfrentadas, «Se hizo» en «—» y «todavía por
   hacer»; el comentario en tres párrafos y **a la izquierda**.
6. **Editar** desde el botón de la cabecera: los campos vienen rellenos.
7. **Darlo por hecho** → sale de Pendientes y aparece en Hechos.
8. **Hechos**: dos grupos de mes, el rótulo con mayúscula, el pie con la cuenta
   del mes en curso.
9. **Deshacer** desde la ficha de uno hecho → vuelve a Pendientes.
10. **Borrar** desde la ficha: confirmación, y al aceptar se sale de la ficha
    sin dejar una pantalla en blanco.
11. **Vacío**: dar por hecho o borrar los cinco y ver «La casa está al día».
12. **Ajustes**: tema claro/oscuro y desconectar.
13. **Todo lo anterior otra vez en oscuro**, que es donde el boceto se había
    inventado los colores y donde más fácil es que algo se pierda contra el
    fondo.

Un aviso de método: la herramienta de clicks del navegador se colgaba en cada
pulsación durante esta sesión. Si vuelve a pasar, cerrar y reabrir el panel del
navegador lo arregló otras veces.

## 6. Lo siguiente: Supabase

Y solo eso. El trabajo es **de infraestructura**:

1. La migración en `supabase/` de la raíz, con la numeración de la suite
   siguiendo donde iba. Una tabla, `pendientes`, con las mismas cuatro columnas
   y el RLS de «usuarios autenticados» que ya usa el resto de la suite.
2. `infraestructura/supabase/cliente.ts` y la implementación de
   `RepositorioPendientes` y `ServicioAutenticacion` contra ella.
3. `contenedor.ts`: elegir según `haySupabase`, como hace la compra.

Ni el dominio, ni los casos de uso, ni las pantallas. Si al hacerlo hay que
tocar alguno, es señal de que algo se coló de la capa de fuera hacia dentro —y
merece anotarse aquí, porque en la compra pasó: el puerto de listas tuvo que
estrecharse cuando se vio lo que costaba de verdad una petición, algo que un
contrato diseñado contra memoria no puede saber.

Después de eso, y no antes, entra en el flujo de despliegue.
