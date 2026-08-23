# SuiteFamilia

Aplicaciones pequeñas para el día a día de una casa. Cada una hace una cosa y
se instala en el móvil como una aplicación aparte, pero todas comparten lo que
de verdad las une: **un solo proyecto de Supabase**, y por tanto **una sola
cuenta por persona**.

| Aplicación | Qué hace | Dirección |
|---|---|---|
| `apps/suite` | La portada: login compartido y una tarjeta por app con sus cifras | `/SuiteFamilia/suite/` |
| `apps/compra` | Lista de la compra compartida y comparativa de precios por unidad de medida | `/SuiteFamilia/compra/` |
| `apps/pendientes` | Lo que la casa tiene a medias, con lo importante destacado | `/SuiteFamilia/pendientes/` |

---

## Por qué un monorepo

Lo que ata a las aplicaciones entre sí no es el código, es la base. El RLS del
esquema dice «usuarios autenticados»: quien tiene cuenta en el proyecto de
Supabase lo ve todo. Eso *es* la familia. Si cada aplicación tuviera su propio
proyecto, habría que dar de alta a cada persona una vez por aplicación y
mantener varios juegos de usuarios que representan a la misma gente.

Con una sola base y un solo repositorio salen tres cosas gratis:

1. **Una cuenta para todo.** Alta y contraseña, una vez.
2. **Sesión compartida.** GitHub Pages sirve todo el repositorio bajo el mismo
   origen (`arlanzon29.github.io`), el `localStorage` es por origen y la sesión
   de Supabase se guarda con la clave del proyecto. Entras en una aplicación y
   las demás ya te conocen.
3. **Un despliegue.** Un `push` compila y publica todas.

---

## Arrancar

```bash
npm run instalar
```

Instala las dependencias de cada aplicación **en su propia carpeta**. Con más
aplicaciones, este comando las recorre todas.

```bash
npm run dev
```

Levanta la lista de la compra. Con más aplicaciones, cada una tiene su atajo
(`npm run dev:compra`), o se entra en su carpeta y se trabaja ahí como en
cualquier proyecto suelto.

Están pensadas para móvil: en el navegador de escritorio, ponlo en vista de
dispositivo a **375×812**.

### Cada aplicación con sus dependencias, y por qué

Lo natural en un monorepo serían los *espacios de trabajo* de npm: un único
`node_modules` y un único `package-lock.json` para todas. **Aquí no se pueden
usar.** El proyecto vive en `D:`, que está formateada en **exFAT**, y los
espacios de trabajo funcionan enlazando cada aplicación dentro de
`node_modules` — enlaces de directorio que exFAT no admite. `npm install`
falla con `EISDIR` al intentar crearlos.

Así que cada aplicación instala lo suyo. Lo único que se pierde es compartir
las dependencias en disco, unos 200 MB por aplicación; nada de lo que hace útil
al monorepo —un repositorio, una base, un despliegue— depende de esto. La otra
salida sería mudar el proyecto a `C:`, que es NTFS, y de momento no compensa.

### Credenciales

Copia `.env.example` a `.env` y rellena con los valores del proyecto de
Supabase. **Va en la raíz, no dentro de cada aplicación**: es la misma base para
todas, y repetirlo por carpeta solo daría ocasión de que se desincronicen. Cada
Vite lo encuentra ahí porque su `envDir` apunta a la raíz.

Para mirar la interfaz sin credenciales, con datos de ejemplo en memoria:

```bash
cd apps/compra
npm run dev -- --mode memoria
```

---

## Cómo está repartido

```
SuiteFamilia/
  apps/            una carpeta por aplicación, cada una con su Vite y su README
    compra/
  paquetes/        lo que compartan dos o más aplicaciones (todavía vacío)
  supabase/        el esquema y las migraciones: UNA base para toda la suite
  scripts/         utilidades de mantenimiento (la copia de seguridad)
  docs/            documentos de la suite
  .env             credenciales de Supabase, compartidas (no versionado)
  certs/           certificados de desarrollo, compartidos (no versionado)
  herramientas/    binarios portables de PostgreSQL para la copia (no versionado)
  dist/            lo compilado: una subcarpeta por aplicación
```

`paquetes/` está vacío a propósito. Lo común se saca **cuando duele repetirlo**,
no antes: con una sola aplicación no hay forma de saber qué comparte de verdad
con las que aún no existen, y una abstracción adivinada cuesta más de deshacer
que la duplicación que evita.

Cuando llegue el momento, ahí no habrá un paquete de npm sino código que se
importa por ruta relativa (`../../paquetes/comun/...`): sin espacios de trabajo
no hay forma de enlazarlo por nombre. Vite y TypeScript lo siguen igual de bien;
solo cambia cómo se escribe el `import`.

---

## Escribir una aplicación nueva

**`apps/compra` es el modelo, y las demás copian de ella.** Ante cualquier duda
—cómo se nombra una carpeta, dónde vive una regla, cómo se pinta una fila— la
respuesta es mirar la compra y hacer lo mismo. Es la única parte de la suite
que ha pasado por la realidad: está terminada, publicada y en uso.

Eso incluye la arquitectura limpia con sus cuatro capas en español, el sistema
visual de `tokens.css` copiado tal cual, y el orden de trabajo: **primero las
pantallas contra los repositorios en memoria, y solo después los casos de uso
contra Supabase**.

Está todo en
[`docs/como-se-escriben-las-aplicaciones.md`](docs/como-se-escriben-las-aplicaciones.md).

---

## Publicar

Cada `push` a `main` compila todas las aplicaciones y las publica en GitHub
Pages. Los detalles y la puesta a punto de una vez están en
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

## Copia de seguridad

El plan gratuito de Supabase no hace copias. Esta sí:

```bash
npm run copia
```

Vuelca esquema, datos e imágenes en `copias\AAAA-MM-DD-HHmm\`. Los detalles,
en la cabecera de [`scripts/copia-seguridad.ps1`](scripts/copia-seguridad.ps1).
