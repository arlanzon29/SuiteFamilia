/**
 * Saca el marcado real de un boceto empaquetado por Claude Design.
 *
 * Un `.html` de Design no es HTML plano: es un empaquetado de cientos de KB
 * donde casi todo el peso son las fuentes en base64. Abrirlo en el navegador
 * funciona, pero para portarlo a React hace falta el fuente, y el fuente está
 * dentro, como una cadena JSON, en un `<script type="__bundler/template">`.
 *
 * Esto lo parsea y lo escribe al lado, con el sufijo `-fuente`.
 *
 *     node scripts/extrae-boceto.mjs docs/Pendientes.html
 *
 * Lo que sale no se puede abrir: las fuentes y el motor apuntan a recursos del
 * empaquetado por identificador. Es para leerlo, que es justo lo que se quiere:
 * se porta leyendo el fuente, no reconstruyendo desde una captura.
 *
 * Dos rarezas del marcado que conviene conocer antes de leerlo:
 *
 *   - Los atributos en camelCase van escapados: `viewBox` es `sc-camel-view-box`
 *     y `onClick` es `sc-camel-on-click`. Al portar se devuelven a su forma.
 *   - Los `{{ ... }}` son enlaces del motor de Design (el tema, sobre todo).
 *     En React se sustituyen por estado de verdad.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const entrada = process.argv[2]
if (!entrada) {
  console.error('Uso: node scripts/extrae-boceto.mjs <boceto.html>')
  process.exit(1)
}

const html = readFileSync(entrada, 'utf8')

const marca = '<script type="__bundler/template"'
const i = html.indexOf(marca)
if (i === -1) {
  console.error(`No hay bloque "__bundler/template" en ${entrada}: ¿es un boceto de Design?`)
  process.exit(1)
}

const crudo = html.slice(html.indexOf('>', i) + 1, html.indexOf('</script>', i)).trim()
const plantilla = JSON.parse(crudo)
const fuente = typeof plantilla === 'string' ? plantilla : plantilla.template

const salida = entrada.replace(/\.html$/, '-fuente.html')
writeFileSync(salida, fuente, 'utf8')

const tableros = [...fuente.matchAll(/data-screen-label="([^"]+)"/g)].map((m) => m[1])
console.log(`${salida} — ${Math.round(fuente.length / 1024)} KB, ${tableros.length} pantallas`)
for (const t of tableros) console.log(`  ${t}`)
