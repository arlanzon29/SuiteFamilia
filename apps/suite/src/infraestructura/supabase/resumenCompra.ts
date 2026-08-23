import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { ResumenCompra } from '../../dominio/modelo'
import type { RepositorioResumenCompra } from '../../dominio/contratos'

/**
 * Las cifras de la tarjeta de Compra, contra la misma función
 * `resumen_inicio()` que usa `apps/compra` (`supabase/migracion-02-resumen-inicio.sql`).
 * No hay migración nueva: la función ya devuelve `sin_precio` y las listas
 * abiertas con sus dos contadores, que es exactamente lo que pide esta
 * pantalla — solo cambia quién suma `pendientes` y cuenta `abiertas`.
 *
 * Es un duplicado a propósito de
 * `apps/compra/src/infraestructura/supabase/resumen.ts`, mismo `rpc` y mismo
 * mapeo de errores: la portada es otra aplicación, con su propio adaptador,
 * que resulta llamar a la misma función porque las cifras que necesita son
 * las mismas.
 */

type Respuesta = {
  sin_precio: number
  abiertas: { id: string; nombre: string; items: number; pendientes: number }[]
}

const mensaje = (e: PostgrestError): string => {
  if (e.code === '42501') return 'La sesión no tiene permiso para esto.'
  if (e.code === 'PGRST202') return 'Falta la función `resumen_inicio` en la base de datos.'
  return e.message
}

export const repositorioResumenCompraSupabase = (sb: SupabaseClient): RepositorioResumenCompra => ({
  async inicio(): Promise<ResumenCompra> {
    const { data, error } = await sb.rpc('resumen_inicio')
    if (error) throw new Error(mensaje(error))
    const r = data as Respuesta
    return {
      porComprar: r.abiertas.reduce((n, l) => n + Number(l.pendientes), 0),
      listasAbiertas: r.abiertas.length,
      sinPrecio: Number(r.sin_precio),
    }
  },
})
