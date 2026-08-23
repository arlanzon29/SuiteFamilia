import type { PostgrestError, SupabaseClient } from '@supabase/supabase-js'
import type { ResumenPendientes } from '../../dominio/modelo'
import type { RepositorioResumenPendientes } from '../../dominio/contratos'

/**
 * Las cifras de la tarjeta de Pendientes: total por hacer y cuántos de esos
 * importantes.
 *
 * No hay una función SQL propia como `resumen_inicio()`: lo por hacer de una
 * casa no crece con el tiempo —se resuelve—, así que traerse la columna
 * `importante` de la tabla entera y contar aquí es tan barato como una
 * cuenta hecha en el servidor. Es el mismo criterio que ya usa `Inicio.tsx`
 * de Pendientes, que también cuenta sobre `listarPorHacer()` en vez de pedir
 * un `count` aparte.
 */

type Fila = { importante: boolean }

/** Supabase responde en inglés; la interfaz habla en castellano. */
const revienta = (error: PostgrestError): never => {
  const m = error.message.toLowerCase()
  if (m.includes('failed to fetch')) throw new Error('Sin conexión con el servidor.')
  throw new Error(error.message)
}

export const repositorioResumenPendientesSupabase = (
  sb: SupabaseClient,
): RepositorioResumenPendientes => ({
  async inicio(): Promise<ResumenPendientes> {
    const { data, error } = await sb.from('pendientes').select('importante').is('finalizado', null)
    if (error) revienta(error)
    const filas = (data ?? []) as Fila[]
    return {
      total: filas.length,
      importantes: filas.filter((f) => f.importante).length,
    }
  },
})
