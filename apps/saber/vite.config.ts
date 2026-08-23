import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Igual que el de la compra, y a propósito: el arranque de una aplicación de la
 * suite no es sitio donde inventar nada. Los comentarios largos de cada
 * decisión están en `apps/compra/vite.config.ts`; aquí va lo justo para saber
 * qué hace cada bloque y qué cambia respecto a aquel.
 *
 * Lo único propio de Saber son el `base` y el `outDir`: `/SuiteFamilia/saber/`
 * en vez de `/SuiteFamilia/compra/`.
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

/** `2026-08-23 17:42`, en hora local, que es la que mira quien compila. */
const compilada = new Date()
  .toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' })
  .replace('T', ' ')

/**
 * La raíz de la suite, dos niveles por encima de `apps/saber/`. De ahí cuelga
 * lo compartido: el `.env` con las credenciales de Supabase —una sola base
 * para toda la suite— y los certificados de desarrollo.
 */
const raiz = (f: string) => fileURLToPath(new URL(`../../${f}`, import.meta.url))

/** HTTPS en la red local, si `mkcert` ha dejado los certificados en `certs/`. */
const clave = raiz('certs/dev-key.pem')
const certificado = raiz('certs/dev-cert.pem')
const hayCertificado = existsSync(clave) && existsSync(certificado)

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? '/SuiteFamilia/saber/' : '/',
  envDir: raiz(''),
  plugins: [react()],
  define: {
    __VERSION__: JSON.stringify(sello),
    __COMPILADA__: JSON.stringify(compilada),
    __ENTORNO__: JSON.stringify(command === 'build' ? 'compilada' : 'dev'),
  },
  build: {
    outDir: raiz('dist/saber'),
    emptyOutDir: true,
  },
  server: {
    host: true,
    ...(hayCertificado
      ? { https: { key: readFileSync(clave), cert: readFileSync(certificado) } }
      : {}),
  },
}))
