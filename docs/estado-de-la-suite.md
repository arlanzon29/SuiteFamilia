# Estado de la suite

Última actualización: **23 de agosto de 2026**.

Lo último: **existe la portada**, `apps/suite`, publicada en
`/SuiteFamilia/suite/`. Es la respuesta al hueco que dejaba anotado el
apartado 6 de este mismo documento: login compartido y, en el Inicio, una
tarjeta por aplicación —Compra y Pendientes— con las mismas cifras que cada
una enseña en la suya y un enlace a la app real. Sin migración nueva: la
tarjeta de Compra llama a la misma `resumen_inicio()` que ya usa
`apps/compra`, y la de Pendientes cuenta sobre la tabla `pendientes` igual que
ya hace `Inicio.tsx` de esa app. Compra y Pendientes llevan ahora, al final de
su Ajustes, una fila «Suite Familia» que enlaza de vuelta — el salto entre
apps ya funciona en las dos direcciones. Escrita contra memoria y contra
Supabase a la vez —no hace falta el camino en dos fases de las otras dos apps,
porque no hay tabla propia que migrar—; queda pendiente el repaso en el
navegador, en claro y en oscuro, con credenciales reales.

Antes: **Pendientes ya está escrita**, con sus nueve pantallas contra
repositorios en memoria y las cuatro capas copiadas de la compra. No toca
Supabase todavía —esa es la fase siguiente— y por eso **no entra aún en el flujo
de despliegue**: `/SuiteFamilia/pendientes/` sigue sin existir, porque publicar
algo que solo funciona contra memoria enseñaría la semilla y perdería lo escrito
al recargar. Queda además un repaso pendiente de las nueve pantallas en el
navegador, en claro y en oscuro. Todo eso, en
[`../apps/pendientes/docs/estado-del-proyecto.md`](../apps/pendientes/docs/estado-del-proyecto.md).

Antes: **se crea SuiteFamilia** y se trae dentro la lista de la compra, que
queda como `apps/compra`. La aplicación no se ha tocado por dentro: mismo
código, mismas capas, misma base. Lo que cambia es dónde vive y cómo se compila.
Ya está **publicada** en <https://arlanzon29.github.io/SuiteFamilia/compra/>.

La segunda aplicación se llama **Pendientes**, no `tareas` como decía antes
este documento. Su boceto, las cuatro decisiones de producto que dejaba
abiertas —se pueden borrar, un «hecho» se puede deshacer, se quedan las cuatro
pestañas y fuera las filas de la suite en Ajustes— y lo que había que corregir
al portarlo están en [`pendientes-boceto.md`](pendientes-boceto.md). Las cuatro
decisiones y las correcciones ya están en el código.

Y queda escrita **la regla que ordena lo que viene**: `apps/compra` es el
modelo y las demás aplicaciones copian de ella —arquitectura limpia con sus
capas en español, `tokens.css` tal cual, y primero las pantallas contra
memoria y después los casos de uso contra Supabase. En
[`como-se-escriben-las-aplicaciones.md`](como-se-escriben-las-aplicaciones.md).

Documento de traspaso de la suite. Lo que le pase a cada aplicación por dentro
se cuenta en su propio documento —para la compra,
[`../apps/compra/docs/estado-del-proyecto.md`](../apps/compra/docs/estado-del-proyecto.md).

---

## 1. Dónde estamos

| Aplicación | Estado | Dirección |
|---|---|---|
| `apps/compra` | Terminada, publicada | <https://arlanzon29.github.io/SuiteFamilia/compra/> |
| `apps/pendientes` | Publicada **en modo escaparate**: la cuenta ya es de Supabase, los datos siguen en memoria | <https://arlanzon29.github.io/SuiteFamilia/pendientes/> |
| `apps/suite` | Escrita, enganchada al despliegue; falta el repaso en el navegador contra credenciales reales | <https://arlanzon29.github.io/SuiteFamilia/suite/> |

**Publicada** el 22 de agosto de 2026 en
<https://github.com/arlanzon29/SuiteFamilia>, repositorio **público** —con el
plan gratuito, Pages solo funciona en públicos—, con *Source: GitHub Actions* y
los dos secretos `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Comprobado sobre lo publicado: la pantalla de entrada se pinta, el paquete lleva
la URL y la clave publicable —**no** la secreta; lo único que aparece de
`sb_secret_` es una comprobación de formato dentro de la propia librería de
Supabase—, y el manifiesto responde con sus tres iconos, así que se instala en
el móvil desde la dirección nueva.

Mientras tanto, la familia sigue usando la aplicación de siempre en
<https://arlanzon29.github.io/ListaCompra/>, que **no se ha tocado**.

**Tropiezo de la primera vez, por si se repite con otro repositorio:** el primer
despliegue falla si *Settings → Pages → Source* no estaba ya en «GitHub Actions»
cuando arrancó la ejecución. Se arregla poniéndolo y repitiendo la ejecución
desde Actions con *Re-run all jobs*; no hace falta volver a subir nada.

## 2. El original se queda donde está

`D:\IA\ListaCompra` sigue tal cual, con su repositorio, su historia y su
publicación funcionando. SuiteFamilia es una **copia**, no una mudanza.

**Por qué:** es la red de seguridad. Si el monorepo sale mal, no se ha perdido
nada; si sale bien, el original se archiva cuando la copia esté probada y la
familia haya instalado la nueva dirección. Las dos versiones pueden convivir
porque apuntan al **mismo proyecto de Supabase**: son la misma lista, vista
desde dos sitios.

**Lo que eso implica:** mientras las dos existan, un arreglo hecho en una no
está en la otra. Conviene no repartir el trabajo — a partir de ahora se toca
SuiteFamilia, y el original solo se mira.

## 3. Una sola base para todas

El RLS del esquema dice «usuarios autenticados»: quien tiene cuenta en el
proyecto de Supabase lo ve todo. Eso *es* la familia, y por eso el esquema y las
migraciones están en `supabase/` de la **raíz**, no dentro de una aplicación.
Las tablas de Pendientes irán al mismo sitio, con la numeración de migraciones
siguiendo donde iba.

De ahí salen dos cosas que no hay que programar:

- **Una cuenta por persona**, no una por aplicación.
- **Sesión compartida**: GitHub Pages sirve todo el repositorio bajo el mismo
  origen, el `localStorage` es por origen y la sesión de Supabase se guarda con
  la clave del proyecto. Entras en una aplicación y las demás ya te conocen.

## 4. Qué se cambió al copiar

La aplicación por dentro, nada. Alrededor:

| Qué | Antes | Ahora |
|---|---|---|
| `package.json` | Uno | Uno en la raíz que reparte órdenes, y otro por aplicación con sus dependencias |
| `tsconfig` | Uno | `tsconfig.base.json` en la raíz; cada aplicación lo extiende |
| `base` de Vite | `/ListaCompra/` | `/SuiteFamilia/compra/` |
| Salida de la compilación | `dist/` de la aplicación | `dist/compra/` de la raíz, para publicar todo de una vez |
| `.env` | Por aplicación | En la raíz, compartido (`envDir` apunta ahí) |
| `certs/` | Por aplicación | En la raíz, compartidos |
| `supabase/`, `scripts/`, `herramientas/` | Dentro de la aplicación | En la raíz: son de la suite |
| Despliegue | Compilaba una | Compila todas las aplicaciones y sube `dist` entera |

## 5. `paquetes/` está vacío a propósito

Lo común —estilos, cliente de Supabase, el esqueleto de capas— **no** se ha
sacado todavía a un paquete compartido.

**Por qué:** con una sola aplicación no hay forma de saber qué comparte de
verdad con las que aún no existen. Una abstracción adivinada cuesta más de
deshacer que la duplicación que evita. Cuando Pendientes esté escrita se verá qué
se repitió de verdad, y eso —y solo eso— es lo que se extrae.

**Ya hay con qué mirarlo.** Escrita Pendientes, lo que se repitió literalmente
es esto, y conviene apuntarlo antes de que se olvide: `tokens.css` (idéntico
byte a byte), el marco de la aplicación de `App.tsx`, `Cabecera`,
`BarraPestanas`, `Aviso` con su `textoError`, `useTema`, `useNavegacion`, el
`Reloj` y la autenticación simulada. No se extrae todavía —falta la fase de
Supabase, y es ahí donde se verá si el contenedor y el cliente también son
comunes—, pero esa es la lista de candidatos.

## 5 bis. Sin espacios de trabajo: `D:` es exFAT

El monorepo **no usa los espacios de trabajo de npm**, que es lo que uno
esperaría. No es una preferencia: `npm install` con espacios de trabajo falla
aquí con `EISDIR`, porque enlaza cada aplicación dentro de `node_modules` y
**exFAT no admite enlaces de directorio**. Comprobado aparte creando un
*junction* a mano: «Función incorrecta».

En su lugar, cada aplicación instala sus dependencias en su carpeta y el
`package.json` de la raíz solo reparte órdenes (`cd apps/compra && npm ...`).

**Qué se pierde:** compartir dependencias en disco, unos 200 MB por aplicación,
y el `package-lock.json` único. Nada de lo que hace útil al monorepo —un
repositorio, una base, un despliegue, una cuenta— depende de eso.

**Lo que arrastra:** cuando haya código común no podrá ser un paquete enlazado
por nombre; se importará por ruta relativa desde `paquetes/`. Vite y TypeScript
lo resuelven igual.

**La salida, si algún día molesta:** mudar el proyecto a `C:`, que es NTFS. Hoy
no compensa —a `C:` le quedan 11,6 GB y a `D:` 61—, pero es la puerta que queda
abierta.

## 6. Lo que queda por decidir

- **Cuándo se archiva el original**, y avisar a la familia de que reinstale la
  aplicación desde la dirección nueva. La instalada apunta a `/ListaCompra/` y
  no se entera del cambio sola.

Ya no está pendiente **la portada**: `/SuiteFamilia/` seguirá dando 404 —esa
dirección no tiene aplicación propia, y no la va a tener—, pero
`/SuiteFamilia/suite/` sí existe, con login compartido y el salto a cada
aplicación desde su tarjeta. Es `apps/suite`, contado arriba.

Ya no está pendiente el nombre del repositorio: es `SuiteFamilia`, y con él la
dirección `/SuiteFamilia/compra/` que llevan escrita el `vite.config.ts` de la
aplicación y el flujo de despliegue.
