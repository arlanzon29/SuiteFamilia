import { execSync } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * La versión que se pinta en la pantalla de inicio.
 *
 * Sirve para una pregunta muy concreta: **¿el móvil tiene lo último?** Entre
 * GitHub Pages, el caché del navegador y la aplicación instalada como PWA hay
 * capas de sobra para que el teléfono siga enseñando la compilación de ayer sin
 * decir nada. Con el sello a la vista se sale de dudas mirando.
 *
 * No vale el `version` de `package.json`: no cambia entre dos compilaciones del
 * mismo día. El commit sí. La fecha va detrás porque un commit sin fecha no
 * dice si esa compilación es de antes o después del último despliegue.
 *
 * Se calcula al compilar, no al arrancar la aplicación, así que en `dev` es el
 * commit que hubiera al levantar el servidor.
 */
const orden = (cmd: string): string => {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim()
  } catch {
    return ''
  }
}

const commit = orden('git rev-parse --short HEAD') || 'sin-git'
const sucio = orden('git status --porcelain') ? '+' : ''
const sello = `${commit}${sucio}`

/** `2026-08-20 17:42`, en hora local, que es la que mira quien compila. */
const compilada = new Date()
  .toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })
  .replace('T', ' ')

/**
 * La raíz de la suite, dos niveles por encima de `apps/compra/`.
 *
 * Todo lo que comparten las aplicaciones cuelga de ahí: el `.env` con las
 * credenciales de Supabase —una sola base para toda la suite— y los
 * certificados de desarrollo. Si cada aplicación tuviera los suyos habría que
 * repetir las credenciales en cada carpeta y volver a generar certificados por
 * aplicación, que es justo lo que el monorepo viene a evitar.
 */
const raiz = (f: string) => fileURLToPath(new URL(`../../${f}`, import.meta.url))

/**
 * HTTPS en la red local.
 *
 * Android solo instala una web como aplicación de verdad —sin barra de
 * direcciones— si la sirve un origen seguro. `http://192.168.1.32:5173` no lo
 * es, así que el servidor de desarrollo necesita certificado.
 *
 * Los certificados los genera `mkcert` en `certs/` de la raíz de la suite y NO
 * se versionan: son de esta máquina. Si no están, el servidor arranca en HTTP
 * como siempre, para que el proyecto siga funcionando recién clonado.
 *
 *   mkcert -install
 *   mkcert -key-file certs/dev-key.pem -cert-file certs/dev-cert.pem \
 *          localhost 127.0.0.1 192.168.1.32
 */
const clave = raiz('certs/dev-key.pem')
const certificado = raiz('certs/dev-cert.pem')
const hayCertificado = existsSync(clave) && existsSync(certificado)

/**
 * Deja `version.json` junto al resto de lo compilado, con el mismo sello que
 * `__VERSION__`. Es lo que la app va a preguntar en caliente (sin caché) para
 * saber si lo que tiene cargado sigue siendo lo último publicado: `index.html`
 * puede tardar hasta 10 minutos en refrescarse en GitHub Pages, así que abrir
 * la app no garantiza traer el build nuevo por sí solo.
 */
const escribeVersion = (outDir: string): Plugin => ({
  name: 'escribe-version-json',
  closeBundle() {
    mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, 'version.json'), JSON.stringify({ version: sello }))
  },
})

/**
 * La compilación va a GitHub Pages, que sirve el repositorio en un
 * subdirectorio y, dentro, cada aplicación en el suyo:
 * `https://arlanzon29.github.io/SuiteFamilia/compra/`. Sin `base`, el HTML
 * pediría los ficheros en la raíz del dominio y saldría una página en blanco.
 *
 * Solo se aplica al compilar. En desarrollo se queda en `/`, para que seguir
 * abriéndola desde el móvil en la red local no cambie de dirección.
 *
 * `isPreview` no sobra: `vite preview` sirve lo ya compilado, pero llega aquí
 * con `command === 'serve'`. Sin comprobarlo, la comprobación previa al
 * despliegue serviría en la raíz una compilación que pide todo desde
 * `/SuiteFamilia/compra/`, y saldría una página en blanco que no es un fallo
 * real.
 *
 * `outDir` saca lo compilado a `dist/compra/` de la raíz. Así el despliegue
 * publica una sola carpeta con todas las aplicaciones dentro, cada una en su
 * subdirectorio, en vez de tener que ir recogiendo un `dist` por aplicación.
 */
export default defineConfig(({ command, isPreview }) => {
  const outDir = raiz('dist/compra')
  return {
    base: command === 'build' || isPreview ? '/SuiteFamilia/compra/' : '/',
    envDir: raiz(''),
    plugins: [react(), ...(command === 'build' ? [escribeVersion(outDir)] : [])],
    define: {
      __VERSION__: JSON.stringify(sello),
      __COMPILADA__: JSON.stringify(compilada),
      __ENTORNO__: JSON.stringify(command === 'build' ? 'compilada' : 'dev'),
    },
    build: {
      outDir,
      emptyOutDir: true,
    },
    server: {
      host: true,
      ...(hayCertificado
        ? { https: { key: readFileSync(clave), cert: readFileSync(certificado) } }
        : {}),
    },
  }
})
