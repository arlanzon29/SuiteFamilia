import type { SupabaseClient } from '@supabase/supabase-js'
import type { Foto, RepositorioFotos } from '../../dominio/contratos'
import { redimensiona } from '../redimensiona'

/**
 * La galería de fotos de cada conocimiento, contra el mismo cubo `imagenes`
 * que ya usa la compra —creado en `migracion-04-fotos.sql`—, dentro de la
 * carpeta `saber/`. No hace falta una migración de Storage aparte: las
 * políticas del cubo son por cubo, no por carpeta.
 *
 * A diferencia de la compra, aquí no se deduce la ruta del nombre: no hay
 * nombre, y puede haber varias fotos por conocimiento. La ruta lleva **los
 * dos ids**, separados por `__` — ninguno de los dos es un uuid con
 * caracteres fuera de lo que Storage acepta, así que no hace falta el plegado
 * de `claveImagen` que sí necesita la compra para nombres escritos a mano:
 *
 *     saber/<id-conocimiento>__<id-foto>-80.jpg
 *     saber/<id-conocimiento>__<id-foto>-720.jpg
 */

const CUBO = 'imagenes'
const CARPETA = 'saber'
const LADOS = { fila: 240, ficha: 720 } as const
const SUFIJOS = { fila: '-80.jpg', ficha: '-720.jpg' } as const

const ruta = (conocimientoId: string, fotoId: string, t: keyof typeof LADOS): string =>
  `${CARPETA}/${conocimientoId}__${fotoId}${SUFIJOS[t]}`

const mensaje = (e: { message: string }): string => {
  const m = e.message.toLowerCase()
  if (m.includes('bucket not found')) {
    return 'Falta el cubo «imagenes». Ejecuta supabase/migracion-04-fotos.sql.'
  }
  if (m.includes('row-level security') || m.includes('unauthorized')) {
    return 'La sesión no tiene permiso para cambiar fotos.'
  }
  if (m.includes('payload too large') || m.includes('exceeded the maximum')) {
    return 'La imagen pesa demasiado incluso después de reducirla.'
  }
  return e.message
}

const noExiste = (e: { message: string }): boolean => {
  const m = e.message.toLowerCase()
  return m.includes('not found') && !m.includes('bucket not found')
}

export const repositorioFotosSupabase = (sb: SupabaseClient): RepositorioFotos => {
  const almacen = sb.storage.from(CUBO)

  const url = (conocimientoId: string, fotoId: string, t: keyof typeof LADOS, version: string) => {
    const { data } = almacen.getPublicUrl(ruta(conocimientoId, fotoId, t))
    return `${data.publicUrl}?v=${version}`
  }

  return {
    /**
     * Se lista la carpeta entera una vez y se agrupa por el prefijo antes de
     * `__`: es más barato que una llamada por conocimiento, y la galería no
     * cambia con cada acción sobre el catálogo.
     */
    async listar(): Promise<Record<string, Foto[]>> {
      const { data, error } = await almacen.list(CARPETA, { limit: 1000 })
      if (error) throw new Error(mensaje(error))

      const mapa: Record<string, Foto[]> = {}
      const fin = SUFIJOS.ficha
      for (const f of data ?? []) {
        if (!f.id || !f.name.endsWith(fin)) continue
        const base = f.name.slice(0, -fin.length)
        const separador = base.indexOf('__')
        if (separador < 0) continue
        const conocimientoId = base.slice(0, separador)
        const fotoId = base.slice(separador + 2)
        const version = String(Date.parse(f.updated_at ?? f.created_at ?? '') || 0)
        const foto: Foto = {
          id: fotoId,
          fila: url(conocimientoId, fotoId, 'fila', version),
          ficha: url(conocimientoId, fotoId, 'ficha', version),
        }
        ;(mapa[conocimientoId] ??= []).push(foto)
      }
      return mapa
    },

    async anadir(conocimientoId: string, fichero: Blob): Promise<void> {
      const fotoId = crypto.randomUUID()
      const partes = await Promise.all(
        (Object.keys(LADOS) as Array<keyof typeof LADOS>).map(async (t) => ({
          t,
          blob: await redimensiona(fichero, LADOS[t]),
        })),
      )
      for (const { t, blob } of partes) {
        const { error } = await almacen.upload(ruta(conocimientoId, fotoId, t), blob, {
          upsert: true,
          contentType: 'image/jpeg',
          cacheControl: '3600',
        })
        if (error) throw new Error(mensaje(error))
      }
    },

    async quitar(conocimientoId: string, fotoId: string): Promise<void> {
      const rutas = (Object.keys(LADOS) as Array<keyof typeof LADOS>).map((t) =>
        ruta(conocimientoId, fotoId, t),
      )
      const { error } = await almacen.remove(rutas)
      if (error && !noExiste(error)) throw new Error(mensaje(error))
    },
  }
}
