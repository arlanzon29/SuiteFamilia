import { execSync } from 'node:child_process'
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Igual que el de la compra, y a propósito: el arranque de una aplicación de la
 * suite no es sitio donde inventar nada. Los comentarios largos de cada
 * decisión están en `apps/compra/vite.config.ts`; aquí va lo justo para saber
 * qué hace cada bloque y qué cambia respecto a aquel.
 *
 * Lo único propio de esta app son el `base` y el `outDir`: `/SuiteFamilia/
 * suite/` en vez de `/SuiteFamilia/compra/`.
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

/** El sello que se pinta abajo en Inicio: responde a «¿el móvil tiene lo último?». */
const commit = orden('git rev-parse --short HEAD') || 'sin-git'
const sucio = orden('git status --porcelain') ? '+' : ''
const sello = `${commit}${sucio}`

/** `2026-08-22 17:42`, en hora local, que es la que mira quien compila. */
const compilada = new Date()
  .toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })
  .replace('T', ' ')

/**
 * La raíz de la suite, dos niveles por encima de `apps/suite/`. De ahí
 * cuelga lo compartido: el `.env` con las credenciales de Supabase —una sola
 * base para toda la suite— y los certificados de desarrollo.
 */
const raiz = (f: string) => fileURLToPath(new URL(`../../${f}`, import.meta.url))

/** HTTPS en la red local, si `mkcert` ha dejado los certificados en `certs/`. */
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

export default defineConfig(({ command, isPreview }) => {
  const outDir = raiz('dist/suite')
  return {
  base: command === 'build' || isPreview ? '/SuiteFamilia/suite/' : '/',
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
