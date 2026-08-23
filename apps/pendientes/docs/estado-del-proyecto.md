# Estado del proyecto

Última actualización: **23 de agosto de 2026**.

Lo último: **Inicio filtra por importante y enseña dos cifras**. «Lo más
antiguo sin hacer» ya no mezcla todo lo que toca: solo enseña lo marcado como
importante, y el kicker pasa a decir «Lo más antiguo **importante** sin
hacer» para que quede claro qué se está mirando. Si hay pendientes pero
ninguno importante, sale un aviso en su lugar en vez del estado vacío general
—ese sigue siendo solo para cuando no queda nada por hacer—. Debajo del saludo
y antes de esa lista se añaden dos cuadros, el mismo componente `Cifra` que ya
tenía Inicio en `apps/compra`: el total de pendientes y el total de
importantes, los dos contando **todo** el histórico y no solo lo que ya toca.

Antes: **los datos ya son de verdad**. La tabla `pendientes` está creada y
la aplicación escribe en ella; con la autenticación, que entró antes, ya no
queda nada simulado por el camino de Supabase. Deja de ser un escaparate.

Con la tabla entran dos cosas que el modelo no tenía: **la fecha en que toca
hacer algo** —y con ella la regla de que lo apuntado para más adelante no
aparece hasta que faltan siete días— y **quién apuntó y quién cerró** cada cosa.

Y antes de eso: la cuenta pasó a ser la de Supabase Auth, la misma de la
compra, con el contenedor eligiendo según `haySupabase`. Y antes de eso, las
nueve pantallas del boceto escritas en React con las cuatro capas de la compra.

> **Lo que queda por comprobar de verdad.** La aplicación compila, pasa
> `tsc --noEmit` y toda la vuelta está recorrida en el navegador **contra
> memoria**, sin un error en consola. Lo que **no** se ha probado ni una vez es
> el repositorio contra la tabla: para eso hay que entrar con la cuenta real, y
> es lo primero de §6. Falta también el recorrido en **tema oscuro**.

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
| Migración `06`, la tabla `pendientes` | escrita y **ejecutada** en Supabase | ✅ |
| `RepositorioPendientes` contra la tabla | escrito | ✅ |
| Fecha prevista, ventana de 7 días, quién apuntó y quién cerró | escritos y probados contra memoria | ✅ |
| Recorrido de las pantallas **en claro, contra memoria** | hecho, sin errores en consola | ✅ |
| El repositorio hablando **con la tabla de verdad** | **sin probar ni una vez** | ⬜ |
| Recorrido en **tema oscuro** | **sin hacer** | ⬜ |
| Entrada en el flujo de despliegue | hecha | ✅ |

**Publicada y, desde la tabla, ya de uso real.** Entró en el despliegue una
sesión antes de tenerla, con los datos todavía en memoria y sabiendo que aquello
era un escaparate: era la única forma de abrirla en un móvil de verdad e
instalarla. Ese aviso **ya no aplica** —lo que se apunte se guarda y lo ve la
otra persona—, y por eso se ha quitado también del comentario de `deploy.yml`.

El `build` de la raíz compila las dos aplicaciones y el flujo de GitHub Actions
tiene su bloque; la carpeta `dist` sube entera, con una subcarpeta por
aplicación.

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

`modelo/pendiente.ts` es todo el modelo, y son **siete campos**:

```ts
type Pendiente = {
  id: string
  titulo: string               // una línea
  descripcion: string          // puede estar vacía
  creado: string               // ISO con zona
  creadoPor: string | null     // identificador de cuenta
  finalizado: string | null    // ISO con zona; nulo mientras esté por hacer
  finalizadoPor: string | null // nulo mientras esté por hacer
  fechaPrevista: string | null // YYYY-MM-DD; nulo = «alguna vez»
}
```

Sin prioridades y sin etiquetas. `creadoPor` y `finalizadoPor` **no son personas
asignadas**: son historia de quién hizo qué, no reparto de trabajo ni permisos
—los dos siguen pudiendo verlo, cerrarlo y borrarlo todo—.

`finalizado` es toda la máquina de estados que hay: nulo es «por hacer», con
fecha es «hecho», y deshacer es volver a ponerlo a nulo. Se sopesó guardar
además la letra —`'P'` y `'C'`— y se dejó fuera: dos versiones de lo mismo
acaban discrepando, y la fecha dice el estado **y** cuándo pasó, que es lo que
Hechos necesita para agrupar por meses. Está razonado en la migración.

Las dos primeras fechas son **instantes**, no días, y van en ISO completo con
zona por lo mismo que `Lista.creada` en la compra: cortar el ISO por la `T` da
el día en UTC, que a partir de las diez de la noche en España ya es el de
mañana. El día se calcula en la pantalla, en la zona de quien mira. Todo lo que
cuenta días pasa por `presentacion/formato.ts`, que lo hace a mediodía para que
el cambio de hora no mueva una resta.

**`fechaPrevista` es al revés: es un día y no un instante.** «Pasar la ITV el 3
de septiembre» no ocurre a las 11:42, ocurre ese día, así que no lleva hora ni
zona y se compara con el «hoy» de quien mira sin convertir nada.

De ella sale la única regla nueva de esta fase, y vive **aquí y no en las
pantallas**: `yaToca` decide qué se enseña —lo que no tiene fecha siempre, y lo
que la tiene desde siete días antes—. Si el filtro estuviera en cada pantalla,
bastaría que a una se le olvidara para enseñar lo que aún no toca. Y la resta no
la hace Postgres a propósito: su `current_date` es UTC, y un pendiente
aparecería un día antes de la cuenta.

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

Nueve casos de uso, **todos asíncronos**. Es justo lo que permitió que Supabase
entrara después sin tocar ni una pantalla, y así fue: al cambiar el repositorio
no se tocó ningún caso de uso.

**Los tres de lectura son el cambio de fondo de esta fase.** Antes había un
`cargarTodo` que se traía la tabla entera y filtraba en el móvil:

| Caso | Qué trae |
|---|---|
| `listarPorHacer()` | todo lo que queda, **incluido lo de más adelante** |
| `listarUltimosHechos(5)` | solo los cinco últimos resueltos |
| `contarResueltosEn(mes)` | la cifra del pie de Hechos, **sin bajar ni una fila** |

La asimetría es el fondo del asunto: **lo que está por hacer no crece** —una
casa tiene unas pocas cosas a medias y se van resolviendo—, pero **lo hecho
crece indefinidamente**. En dos años son cientos de filas, y traerlas todas en
cada arranque para pintar dos grupos de mes es el error que en la compra hubo
que deshacer *después*, con el puerto de listas ya escrito. Aquí se vio antes.

Que la cuenta del mes vaya aparte es consecuencia de acotar el listado: lo
cargado son los cinco últimos, que pueden ser todos de meses anteriores, así que
la cifra ya no sale de ahí. Contra Supabase es un `count` de cabecera, más
barato que ampliar el listado solo para poder contar.

Los tres van en paralelo con `Promise.all`: son independientes, así que la carga
tarda lo que la más lenta y no lo que las tres sumadas.

Y una regla que cambia: **`editar` sí toca la fecha prevista**, a diferencia de
las otras dos. `creado` y `finalizado` son registro de lo que pasó y no se
retocan; la fecha prevista es un plan, y los planes cambian.

El recorte del texto (`titulo.trim()`, y sin título no se crea nada) vive aquí y
no en la pantalla ni en el repositorio: «un título en blanco no es un pendiente»
es una regla de la aplicación, no un detalle de la caja de texto ni de la tabla.

### `infraestructura/`

`contenedor.ts` es el único sitio donde se elige implementación, y **ya lleva la
comprobación de `haySupabase` de la compra**: con `.env` la autenticación es
Supabase Auth, sin él es la simulada.

Con `.env`, **la autenticación y los pendientes son los dos de Supabase**; sin
él, los dos simulados. El modo mixto de la sesión anterior —cuenta real, datos
en memoria— duró lo que tardó en existir la tabla, que es el orden que marcaba
lo que había: la cuenta ya estaba creada desde la compra y la tabla no.

`supabase/pendientes.ts` implementa `RepositorioPendientes` contra la tabla. Dos
cosas que conviene saber al leerlo:

- **`id` es un autonumérico en la tabla y texto en el dominio**, así que se
  convierte al entrar y al salir. Es la única traducción de identidad que hay.
  Se deja como texto porque un identificador solo se compara y se pasa por la
  ruta de la ficha: nunca se suma ni se ordena por él.
- **`creado`, `creado_por` y las dos de cierre no se mandan al insertar.** Las
  pone la base con `now()` y `auth.uid()`. Al marcar hecho sí viajan calculadas,
  porque en un `update` normal no se pueden pedir desde el cliente; van las dos
  en la misma escritura, que es lo que sostiene el `check` de la tabla.

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

### Y otra, después de tener el campo `importante`

Con el filtro de «solo importantes» ya escrito en la pantalla de Pendientes,
Inicio pasó a usarlo también, pero **sin el chip**: en Inicio no hay elección,
lo más antiguo que se enseña siempre es lo importante, y el kicker lo dice.
Debajo del saludo se añadieron además dos cuadros con el total de pendientes y
el total de importantes, copiando el componente `Cifra` de
`apps/compra/src/presentacion/pantallas/Inicio.tsx` tal cual.

## 5. Lo comprobado y lo que falta

### Comprobado, en `pendientes-memoria` a 375×812 y sin un error en consola

| | Qué se vio |
|---|---|
| **Acceso** | Entra con un correo con «@». Con la contraseña vacía sale «Correo o contraseña incorrectos.», y el aviso **se lee bien en oscuro** |
| **Inicio** | Saludo, fecha y los cinco más antiguos con «hace N días» |
| **Pendientes** | Cinco filas, la más antigua arriba; la secundaria recorta a dos renglones |
| **La ventana de 7 días** | Los apuntados a 24 y 60 días **no** salen en la lista: se pliegan en «2 apuntados para más adelante», y al desplegarlos cada uno dice «Toca en N días» |
| **Nuevo** | Con fecha a 3 días, la fila aparece como «Toca en 3 días» |
| **Ficha** | Las dos fechas enfrentadas con **quién** —«hace 3 días · la otra persona»—, la fecha prevista aparte, y la descripción a la izquierda |
| **Editar** | Los tres campos vienen rellenos, fecha incluida; al moverla a 40 días el pendiente salta a «más adelante» |
| **Darlo por hecho** | Sube a Hechos, firma «hoy · tú», y la fecha prevista deja de enseñarse |
| **Hechos** | Cinco filas exactas en sus grupos de mes, y el pie pasa de 4 a 5 al cerrar uno — **la cuenta es correcta aunque el listado no la contenga**, que es justo lo que se buscaba al pedirla aparte |
| **Deshacer** | Devuelve fecha y persona a nulo a la vez, y reaparece la fecha prevista |
| **Borrar** | Confirmación, y al aceptar sale de la ficha a la pantalla de la que venía, sin dejarla en blanco |
| **Desconectar** | Vuelve a Acceso y borra la sesión guardada |

De la autenticación real, además: en la entrada `pendientes`, con el `.env` de
la raíz, el login sale a `/auth/v1/token?grant_type=password` del proyecto y el
servidor rechaza unas credenciales que la simulada habría aceptado.

Y las ocho columnas que pide `supabase/pendientes.ts` coinciden con las de la
migración, comprobado comparando las dos listas.

### Lo que falta

1. **El repositorio contra la tabla de verdad. No ha hablado con ella ni una
   vez**, y es lo único importante que queda: todo lo de arriba es contra
   memoria. Hace falta entrar con la cuenta real, y entonces mirar que crear
   escriba fila, que `creado_por` se rellene solo, que dar por hecho selle las
   dos columnas y que la cuenta del mes salga del `count`.
2. **El recorrido en tema oscuro**, que sigue sin hacerse salvo Acceso. Es
   donde el boceto se había inventado los colores y donde más fácil es que algo
   se pierda contra el fondo. Lo nuevo de esta fase —la línea de «más
   adelante», la fecha prevista de la ficha, el campo de fecha del diálogo— no
   se ha visto en oscuro **nunca**.
3. **El estado vacío**, que no se ha vuelto a ver desde que la lista tiene dos
   secciones: hay que comprobar que «La casa está al día» sale cuando no queda
   nada *y* que no aparece cuando lo único que queda está en «más adelante».

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
