import type { Conocimiento, Tema } from '../../dominio/modelo'
import type { Foto } from '../../dominio/contratos'
import { semilla } from './semilla'

/**
 * Estado compartido de los repositorios de memoria. Vive un único almacén
 * para que borrar un tema pueda arrastrar sus conocimientos sin que un
 * repositorio conozca al otro.
 */
export type Almacen = {
  temas: Tema[]
  conocimientos: Conocimiento[]
  /** URLs `blob:` de las fotos añadidas en esta sesión. Ver repositorios.ts. */
  fotos: Record<string, Foto[]>
}

export const nuevoAlmacen = (): Almacen => ({ ...semilla(), fotos: {} })

let contador = 0
/** Identificadores locales; con Supabase los genera la base de datos. */
export const nuevoId = (prefijo: string): string =>
  prefijo + Date.now().toString(36) + (contador++).toString(36)

/** Copia superficial, para que quien recibe los datos no pueda mutar el almacén. */
export const copia = <T,>(xs: T[]): T[] => xs.map((x) => ({ ...x }))
