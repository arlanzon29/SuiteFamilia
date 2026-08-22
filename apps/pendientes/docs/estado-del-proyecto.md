# Estado del proyecto

Última actualización: **22 de agosto de 2026**.

Lo último: **la cuenta ya es de verdad**. La autenticación entra contra
Supabase Auth con la misma cuenta de la compra —una sola para toda la suite—,
y el contenedor elige según `haySupabase` igual que allí. Los pendientes
siguen en memoria: la tabla es el paso siguiente.

Antes: **Pendientes existe**. Las nueve pantallas del boceto están escritas en
React con las cuatro capas de la compra, corriendo contra repositorios en
memoria con una semilla realista.

> **Lo que queda por comprobar de verdad.** La aplicación compila, pasa
> `tsc --noEmit` y arranca. Del recorrido de §5 están vistos los pasos 1 y 2
> —Acceso e Inicio— en claro **y** en oscuro, y suelto el 12 en su parte de
> desconectar. Los demás **no se han mirado**. Está en §5, con lo que hay que
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
| Autenticación contra Supabase Auth | escrita y probada en el navegador | ✅ |
| Recorrido de las nueve pantallas, claro y oscuro | **a medias**: pasos 1, 2 y el desconectar del 12 | 🟨 |
| Migración y repositorio de pendientes en Supabase | **sin empezar**, es lo siguiente | ⬜ |
| Entrada en el flujo de despliegue | hecha, **en modo escaparate** | 🟨 |

**Publicada, y con una advertencia que hay que leer entera.** Entra en el
despliegue antes de tener la tabla, que es al revés de lo que decía este
documento, y la razón es concreta: era la única forma de abrirla en un móvil
de verdad e instalarla. El `build` de la raíz ya compila las dos, y el flujo de
GitHub Actions tiene su bloque; la carpeta `dist` sube entera, con una
subcarpeta por aplicación.

Lo que eso significa mientras los datos sigan en memoria: **cada teléfono verá
la semilla**, lo que se apunte se perderá al recargar y no llegará al de nadie
más. La cuenta sí es real. Es decir, sirve para mirar el diseño y para
instalarla, **no para usarla**, y conviene decírselo a quien la abra. Deja de
ser un escaparate en cuanto entre la tabla `pendientes` del §6.

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

**`pendientes-memoria` ya distingue de verdad**, desde que la autenticación es
la de Supabase. `--mode memoria` carga el `.env.memoria` de la raíz, que vacía
las dos variables para que `haySupabase` salga falso; con eso la autenticación
vuelve a ser la simulada. Las otras dos entradas leen el `.env` de la raíz y
piden una cuenta de verdad. Hasta este cambio las tres hacían lo mismo, y por
eso la entrada estaba creada de antemano.

Con lo cual, **cómo se entra depende de la entrada**:

| Entrada | Autenticación | Cómo se entra |
|---|---|---|
| `pendientes`, `pendientes-compilada` | Supabase Auth | cuenta de verdad, la misma de la compra |
| `pendientes-memoria` | simulada | cualquier correo con «@» y cualquier contraseña |

Para revisar la interfaz —el recorrido del apartado 5, sin ir más lejos— la
entrada es `pendientes-memoria`: no hace falta credencial y los datos siguen
siendo los de la semilla.

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

`contenedor.ts` es el único sitio donde se elige implementación, y **ya lleva la
comprobación de `haySupabase` de la compra**: con `.env` la autenticación es
Supabase Auth, sin él es la simulada.

De momento eso deja un **modo mixto, y a propósito**: la cuenta es real y los
pendientes siguen en memoria. Es el mismo camino que recorrió la compra, donde
los puertos entraron de uno en uno y no todos a la vez; aquí el orden lo marca
lo que existe, porque la cuenta ya estaba creada en Supabase y es la misma de
la compra, mientras que la tabla `pendientes` no tiene todavía ni migración.
La ventaja de tener un solo sitio donde se decide es justo esta: el modo mixto
se lee entero en diez líneas y se ve qué es real y qué no.

`supabase/cliente.ts` es copia del de la compra, y `supabase/autenticacion.ts`
también salvo el `import` de `contratos`. No se extrae todavía a un paquete
común por lo que dice el documento de la suite: primero se ve qué se repite de
verdad al terminar la fase de Supabase, y entonces se extrae.

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

El recorrido está **empezado, no terminado**. Lo comprobado hasta ahora, en
`pendientes-memoria` a 375×812 y en los dos temas:

- **Paso 1, Acceso.** Entra con un correo con «@» y cualquier contraseña.
  Comprobado además el fallo: con la contraseña vacía sale «Correo o contraseña
  incorrectos.», y el aviso **se lee bien en oscuro** —filete de oro sobre
  fondo de acento, no se pierde contra el fondo—. Conviene saber que el campo
  de contraseña lleva «••••••••» de marcador de posición y **parece relleno
  cuando está vacío**: es lo que hace creer que el botón no responde.
- **Paso 2, Inicio.** Saludo, fecha y los cinco más antiguos con «hace N días».
- **Paso 12, a medias.** Desconectar vuelve a Acceso, borra la sesión guardada
  y no deja errores en consola. El tema claro/oscuro del mismo paso sigue sin
  probarse a conciencia.

Y una comprobación que no estaba en la lista, porque entonces no había qué
comprobar: en la entrada `pendientes`, con el `.env` de la raíz, el login sale
a `/auth/v1/token?grant_type=password` del proyecto y el servidor rechaza unas
credenciales que la simulada habría aceptado. Es decir: la autenticación real
está en el camino, no solo escrita.

**Lo demás sigue sin mirarse.** El recorrido entero, en orden, en
`pendientes-memoria` y a 375×812:

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

Dos avisos de método. La herramienta de clicks del navegador se colgaba en cada
pulsación; si vuelve a pasar, cerrar y reabrir el panel del navegador lo
arregló otras veces. Y hay una salida por si se vuelve a colgar: pulsar por
JavaScript desde el panel —`.click()` sobre el botón— dispara el mismo camino
de React, y así se comprobó todo lo de arriba.

El recorrido va en `pendientes-memoria` **y ahora es obligatorio que sea ahí**:
las otras dos entradas piden una cuenta de verdad desde que la autenticación es
la de Supabase.

## 6. Lo siguiente: Supabase

Y solo eso. El trabajo es **de infraestructura**, y va por la mitad:

1. ✅ `infraestructura/supabase/cliente.ts` y la implementación de
   `ServicioAutenticacion` contra Supabase Auth.
2. ✅ `contenedor.ts`: elegir según `haySupabase`, como hace la compra.
3. ⬜ La migración en `supabase/` de la raíz, con la numeración de la suite
   siguiendo donde iba. Una tabla, `pendientes`, con las mismas cuatro columnas
   y el RLS de «usuarios autenticados» que ya usa el resto de la suite.
4. ⬜ La implementación de `RepositorioPendientes` contra esa tabla, y cambiar
   en `contenedor.ts` la única línea que hoy sigue montando el repositorio en
   memoria dentro del camino de Supabase.

La autenticación fue primero porque era lo único que ya tenía con qué hablar:
la cuenta existe en Supabase desde la compra. La tabla hay que crearla.

Ni el dominio, ni los casos de uso, ni las pantallas. Si al hacerlo hay que
tocar alguno, es señal de que algo se coló de la capa de fuera hacia dentro —y
merece anotarse aquí, porque en la compra pasó: el puerto de listas tuvo que
estrecharse cuando se vio lo que costaba de verdad una petición, algo que un
contrato diseñado contra memoria no puede saber.

Después de eso, y no antes, entra en el flujo de despliegue.
