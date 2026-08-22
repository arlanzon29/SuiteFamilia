import type { Pendiente } from '../../dominio/modelo'
import { semilla } from './semilla'

/**
 * Estado compartido de los repositorios de memoria. Hoy solo hay uno, pero el
 * almacén se mantiene aparte por la misma razón que en la compra: es lo que
 * permite que entre otro repositorio sin que ninguno tenga que conocer al otro.
 */
export type Almacen = {
  pendientes: Pendiente[]
}

export const nuevoAlmacen = (): Almacen => semilla()

/**
 * Almacén sin datos de ejemplo. No lo usa nadie todavía; lo usará el camino
 * mixto de la fase de Supabase, cuando parte de los datos ya sean reales y
 * mezclarlos con la semilla dejaría filas fantasma.
 */
export const almacenVacio = (): Almacen => ({ pendientes: [] })

let contador = 0
/** Identificadores locales; con Supabase los genera la base de datos. */
export const nuevoId = (prefijo: string): string =>
  prefijo + Date.now().toString(36) + (contador++).toString(36)

/** Copia superficial, para que quien recibe los datos no pueda mutar el almacén. */
export const copia = <T,>(xs: T[]): T[] => xs.map((x) => ({ ...x }))
