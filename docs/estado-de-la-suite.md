# Estado de la suite

Última actualización: **22 de agosto de 2026**.

Lo último: **se crea SuiteFamilia** y se trae dentro la lista de la compra, que
queda como `apps/compra`. La aplicación no se ha tocado por dentro: mismo
código, mismas capas, misma base. Lo que cambia es dónde vive y cómo se compila.

Documento de traspaso de la suite. Lo que le pase a cada aplicación por dentro
se cuenta en su propio documento —para la compra,
[`../apps/compra/docs/estado-del-proyecto.md`](../apps/compra/docs/estado-del-proyecto.md).

---

## 1. Dónde estamos

| Aplicación | Estado | Dirección prevista |
|---|---|---|
| `apps/compra` | Terminada y en uso | `/SuiteFamilia/compra/` |
| tareas | Sin empezar — es lo siguiente | `/SuiteFamilia/tareas/` |

**Todavía sin publicar.** El repositorio es local: no hay nada en GitHub ni en
Pages. Mientras tanto, la familia sigue usando la aplicación de siempre en
<https://arlanzon29.github.io/ListaCompra/>, que **no se ha tocado**.

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
Las tablas de tareas irán al mismo sitio, con la numeración de migraciones
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
deshacer que la duplicación que evita. Cuando tareas esté escrita se verá qué
se repitió de verdad, y eso —y solo eso— es lo que se extrae.

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

- **La portada.** `/SuiteFamilia/` no tiene nada: cada aplicación se abre por su
  dirección. Hace falta decidir si se pone una página que las liste o se deja
  así, porque hoy esa dirección daría un 404.
- **Cuándo se archiva el original**, y avisar a la familia de que reinstale la
  aplicación desde la dirección nueva. La instalada apunta a `/ListaCompra/` y
  no se entera del cambio sola.
- **El nombre del repositorio en GitHub**, que fija la dirección: hoy los
  ficheros dan por hecho `SuiteFamilia`.
